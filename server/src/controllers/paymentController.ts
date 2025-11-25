import crypto from "crypto";
import { Request, Response } from "express";
import { PromoCode } from "@prisma/client";
import { prisma } from "../config/prisma";
import { stripe } from "../config/stripeClient";
import { createInvoiceForOrder } from "../services/invoiceService";
import { validatePromoCodeForTotal } from "../services/promoService";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

interface CheckoutItemInput {
  productId: string;
  quantity?: number;
}

/**
 * Création d'une session Stripe Checkout pour les logiciels téléchargeables.
 * Nécessite un utilisateur connecté.
 * Les informations utiles (userId + liste des produits) sont stockées dans metadata
 * pour être récupérées dans le webhook Stripe après paiement.
 */
export async function createDownloadCheckoutSession(
  req: Request,
  res: Response
) {
  const request = req as AuthenticatedRequest;

  try {
    const userId = request.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const { items, promoCode } = req.body as {
      items?: CheckoutItemInput[];
      promoCode?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "La liste des produits est vide ou invalide." });
    }

    const normalizedItems = items.map((raw) => ({
      productId: String(raw.productId),
      quantity:
        raw.quantity && Number(raw.quantity) > 0
          ? Number(raw.quantity)
          : 1,
    }));

    const productIds = normalizedItems.map((it) => it.productId);

    const products = await prisma.downloadableProduct.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length !== normalizedItems.length) {
      return res.status(400).json({
        message:
          "Certains produits demandés sont introuvables ou ne sont plus disponibles.",
      });
    }

    const productMap = products.reduce<
      Record<string, (typeof products)[number]>
    >((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const totalCents = normalizedItems.reduce((sum, it) => {
      const product = productMap[it.productId];
      if (!product) return sum;
      return sum + product.priceCents * it.quantity;
    }, 0);

    if (totalCents <= 0) {
      return res.status(400).json({
        message: "Le montant de la commande doit être supérieur à 0.",
      });
    }

    let appliedPromo: PromoCode | null = null;
    let promoDiscountCents = 0;

    if (promoCode && promoCode.trim()) {
      const result = await validatePromoCodeForTotal(promoCode, totalCents);

      if (!result) {
        return res.status(400).json({
          message:
            "Ce code promo est invalide, expiré ou n'est plus disponible.",
        });
      }

      appliedPromo = result.promo;
      promoDiscountCents = result.discountCents;
    }

    const payableCents = totalCents - promoDiscountCents;

    if (payableCents <= 0) {
      return res.status(400).json({
        message: "Le montant après réduction doit être strictement supérieur à 0.",
      });
    }

    const successUrl =
      process.env.STRIPE_SUCCESS_URL ||
      "http://localhost:5173/paiement/success";
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL ||
      "http://localhost:5173/paiement/cancel";

    // On stocke les infos nécessaires dans metadata pour les récupérer dans le webhook
    const metadata = {
      userId,
      items: JSON.stringify(
        normalizedItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        }))
      ),
      promoCodeId: appliedPromo ? appliedPromo.id : "",
      promoCode: appliedPromo ? appliedPromo.code : "",
      promoDiscountCents: promoDiscountCents.toString(),
    };

    const currency =
      products[0]?.currency?.toLowerCase() || process.env.CURRENCY || "eur";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: payableCents,
            product_data: {
              name: "Commande de logiciels téléchargeables",
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return res.status(201).json({ url: session.url });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de paiement Stripe :",
      error
    );
    return res.status(500).json({
      message:
        "Erreur lors de la création de la session de paiement Stripe.",
    });
  }
}

/**
 * Webhook Stripe (simplifié pour le développement).
 *
 * ATTENTION : ici on ne vérifie PAS la signature Stripe (pas de constructEvent),
 * on suppose que req.body contient l'événement. C'est suffisant pour des tests,
 * mais en production il faudra absolument utiliser stripe.webhooks.constructEvent
 * avec STRIPE_WEBHOOK_SECRET.
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const event = req.body as any;

    if (!event || !event.type) {
      return res.status(400).json({ message: "Événement Stripe invalide." });
    }

    if (event.type !== "checkout.session.completed") {
      // On ignore les autres événements pour l'instant
      return res.status(200).json({ received: true });
    }

    const session = event.data?.object as any;

    if (!session) {
      console.error(
        "[Stripe webhook] checkout.session.completed sans data.object"
      );
      return res.status(200).json({ received: true });
    }

    const metadata = session.metadata || {};
    const userId = metadata.userId as string | undefined;
    const itemsJson = metadata.items as string | undefined;
    const promoCodeId = metadata.promoCodeId || "";
    const promoDiscountCentsRaw = metadata.promoDiscountCents || "0";
    const promoDiscountCents = Number(promoDiscountCentsRaw) || 0;
    const promoCodeUsed = metadata.promoCode || "";

    if (!userId || !itemsJson) {
      console.error(
        "[Stripe webhook] metadata manquante (userId ou items). Session id :",
        session.id
      );
      return res.status(200).json({ received: true });
    }

    let parsedItems: { productId: string; quantity: number }[] = [];
    try {
      const raw = JSON.parse(itemsJson);
      if (Array.isArray(raw)) {
        parsedItems = raw.map((it: any) => ({
          productId: String(it.productId),
          quantity:
            it.quantity && Number(it.quantity) > 0
              ? Number(it.quantity)
              : 1,
        }));
      }
    } catch (err) {
      console.error(
        "[Stripe webhook] Impossible de parser metadata.items :",
        err
      );
      return res.status(200).json({ received: true });
    }

    if (parsedItems.length === 0) {
      console.error(
        "[Stripe webhook] Liste des produits vide après parsing metadata.items."
      );
      return res.status(200).json({ received: true });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error(
        "[Stripe webhook] Utilisateur introuvable pour userId :",
        userId
      );
      return res.status(200).json({ received: true });
    }

    const productIds = parsedItems.map((it) => it.productId);

    const products = await prisma.downloadableProduct.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length === 0) {
      console.error(
        "[Stripe webhook] Aucun produit valide trouvé pour la commande. userId :",
        userId
      );
      return res.status(200).json({ received: true });
    }

    const webhookCurrency = products[0]?.currency || "EUR";

    const productMap = products.reduce<
      Record<string, (typeof products)[number]>
    >((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const totalCents = parsedItems.reduce((sum, it) => {
      const product = productMap[it.productId];
      if (!product) return sum;
      return sum + product.priceCents * it.quantity;
    }, 0);

    if (totalCents <= 0) {
      console.error(
        "[Stripe webhook] Montant total invalide pour userId :",
        userId
      );
      return res.status(200).json({ received: true });
    }

    const payableCents = Math.max(totalCents - promoDiscountCents, 0);

    if (payableCents <= 0) {
      console.error(
        "[Stripe webhook] Montant à payer non positif après remise pour userId :",
        userId
      );
      return res.status(200).json({ received: true });
    }

    // Création de la commande (status PAID car Stripe a confirmé le paiement)
    const order = await prisma.order.create({
      data: {
        userId,
        totalBeforeDiscount: totalCents,
        discountAmount: promoDiscountCents > 0 ? promoDiscountCents : 0,
        totalPaid: payableCents,
        currency: webhookCurrency,
        status: "PAID",
        paidAt: new Date(),
        promoCodeId: promoCodeId || null,
        stripeSessionId: session.id,
        stripePaymentIntentId: (session as any).payment_intent || null,
        items: {
          create: parsedItems
            .filter((it) => !!productMap[it.productId])
            .map((it) => ({
              productId: it.productId,
              productNameSnapshot: productMap[it.productId].name,
              priceCents: productMap[it.productId].priceCents,
              quantity: it.quantity,
              lineTotal: productMap[it.productId].priceCents * it.quantity,
              downloadToken: crypto.randomBytes(24).toString("hex"),
            })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    await createInvoiceForOrder({
      order,
      user,
      billingEmail: session.customer_details?.email || user.email,
      billingName:
        session.customer_details?.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    });

    if (promoCodeId && promoDiscountCents > 0) {
      await prisma.promoCode.update({
        where: { id: promoCodeId },
        data: {
          currentUses: {
            increment: 1,
          },
        },
      });

      if (promoCodeUsed) {
        console.log(
          "[Stripe webhook] Code promo appliqué et incrémenté :",
          promoCodeUsed
        );
      }
    }

    console.log(
      "[Stripe webhook] Commande créée avec succès pour userId :",
      userId,
      "orderId :",
      order.id
    );

    // Stripe attend toujours un 2xx pour considérer le webhook comme reçu
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] Erreur dans le handler :", error);
    // On renvoie tout de même 200 pour éviter les retries infinis en dev
    return res.status(200).json({ received: true });
  }
}
