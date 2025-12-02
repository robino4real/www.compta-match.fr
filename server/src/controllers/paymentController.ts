import { Request, Response } from "express";
import { PromoCode } from "@prisma/client";
import { prisma } from "../config/prisma";
import { stripe } from "../config/stripeClient";
import { createInvoiceForOrder } from "../services/invoiceService";
import { generateDownloadLinksForOrder } from "../services/downloadLinkService";
import { validatePromoCodeForTotal } from "../services/promoService";
import {
  sendInvoiceAvailableEmail,
  sendOrderConfirmationEmail,
} from "../services/transactionalEmailService";

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

interface BillingInfo {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  vatNumber?: string;
}

function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeBilling(raw: any): BillingInfo {
  return {
    firstName: sanitizeString(raw?.firstName),
    lastName: sanitizeString(raw?.lastName),
    company: sanitizeString(raw?.company),
    address1: sanitizeString(raw?.address1),
    address2: sanitizeString(raw?.address2),
    postalCode: sanitizeString(raw?.postalCode),
    city: sanitizeString(raw?.city),
    country: sanitizeString(raw?.country) || "France",
    email: sanitizeString(raw?.email),
    vatNumber: sanitizeString(raw?.vatNumber),
  };
}

function getBillingValidationError(billing: BillingInfo): string | null {
  if (!billing.firstName || !billing.lastName) {
    return "Le nom et le prénom sont requis.";
  }
  if (!billing.address1 || !billing.postalCode || !billing.city || !billing.country) {
    return "L'adresse de facturation est incomplète.";
  }
  if (!billing.email) {
    return "L'email de facturation est requis.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(billing.email)) {
    return "L'email de facturation n'est pas valide.";
  }
  return null;
}

function buildBillingAddress(billing: BillingInfo): string {
  const parts = [
    billing.address1,
    billing.address2,
    `${billing.postalCode} ${billing.city}`.trim(),
    billing.country,
  ].filter(Boolean);

  return parts.join(", ");
}

function buildSuccessUrl(baseUrl: string): string {
  if (baseUrl.includes("{CHECKOUT_SESSION_ID}")) {
    return baseUrl;
  }

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}session_id={CHECKOUT_SESSION_ID}`;
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

    const { items, promoCode, billing, acceptedTerms, acceptedLicense } =
      req.body as {
        items?: CheckoutItemInput[];
        promoCode?: string;
        billing?: BillingInfo;
        acceptedTerms?: boolean;
        acceptedLicense?: boolean;
      };

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "La liste des produits est vide ou invalide." });
    }

    const billingInfo = normalizeBilling(billing);
    const billingError = getBillingValidationError(billingInfo);

    if (billingError) {
      return res.status(400).json({ message: billingError });
    }

    if (!acceptedTerms || !acceptedLicense) {
      return res.status(400).json({
        message:
          "Merci d'accepter les conditions d'utilisation et le contrat de licence avant de payer.",
      });
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

    const billingName = `${billingInfo.firstName} ${billingInfo.lastName}`.trim();
    const billingAddress = buildBillingAddress(billingInfo);

    const successUrl = buildSuccessUrl(
      process.env.STRIPE_SUCCESS_URL ||
        "http://localhost:5173/paiement/success"
    );
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
      billingName,
      billingEmail: billingInfo.email,
      billingCompany: billingInfo.company || "",
      billingAddress,
      billingVatNumber: billingInfo.vatNumber || "",
      acceptedTerms: acceptedTerms ? "true" : "false",
      acceptedLicense: acceptedLicense ? "true" : "false",
    };

    const currency =
      products[0]?.currency?.toLowerCase() || process.env.CURRENCY || "eur";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe sélectionne automatiquement les moyens de paiement disponibles ;
      // le paramètre payment_method_types est volontairement omis pour rester
      // compatible avec les dernières versions de l'API.
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
      customer_email: billingInfo.email,
      metadata,
    });

    return res.status(201).json({ url: session.url });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de paiement Stripe :",
      error
    );

    const stripeMessage =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as any).message === "string"
        ? (error as any).message
        : null;

    return res.status(500).json({
      message:
        stripeMessage ||
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
    const billingNameFromMetadata =
      (metadata.billingName as string | undefined)?.trim() || "";
    const billingEmailFromMetadata =
      (metadata.billingEmail as string | undefined)?.trim() || "";
    const billingAddressFromMetadata =
      (metadata.billingAddress as string | undefined)?.trim() || "";
    const acceptedTerms = metadata.acceptedTerms === "true";
    const acceptedLicense = metadata.acceptedLicense === "true";

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

    const resolvedBillingName =
      billingNameFromMetadata ||
      session.customer_details?.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email;

    const resolvedBillingEmail =
      billingEmailFromMetadata ||
      session.customer_details?.email ||
      user.email;

    const resolvedBillingAddress =
      billingAddressFromMetadata ||
      (() => {
        const addr = (session.customer_details as any)?.address;
        if (!addr) return "";
        const parts = [
          addr.line1,
          addr.line2,
          `${addr.postal_code || ""} ${addr.city || ""}`.trim(),
          addr.country,
        ].filter(Boolean);
        return parts.join(", ");
      })();

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
        billingNameSnapshot: resolvedBillingName,
        billingEmailSnapshot: resolvedBillingEmail,
        billingAddressSnapshot: resolvedBillingAddress || null,
        acceptedTerms,
        acceptedLicense,
        items: {
          create: parsedItems
            .filter((it) => !!productMap[it.productId])
            .map((it) => ({
              productId: it.productId,
              productNameSnapshot: productMap[it.productId].name,
              priceCents: productMap[it.productId].priceCents,
              quantity: it.quantity,
              lineTotal: productMap[it.productId].priceCents * it.quantity,
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

    await generateDownloadLinksForOrder(order.id, userId);

    const invoice = await createInvoiceForOrder({
      order,
      user,
      billingEmail: resolvedBillingEmail,
      billingName: resolvedBillingName,
      billingAddress: resolvedBillingAddress || null,
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

    await sendOrderConfirmationEmail(order.id);
    if (invoice) {
      await sendInvoiceAvailableEmail(invoice.id);
    }

    // Stripe attend toujours un 2xx pour considérer le webhook comme reçu
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] Erreur dans le handler :", error);
    // On renvoie tout de même 200 pour éviter les retries infinis en dev
    return res.status(200).json({ received: true });
  }
}

export async function getDownloadCheckoutConfirmation(
  req: Request,
  res: Response
) {
  const request = req as AuthenticatedRequest;

  try {
    const userId = request.user?.id;
    const sessionId = req.query.session_id as string | undefined;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    if (!sessionId || !sessionId.trim()) {
      return res
        .status(400)
        .json({ message: "Identifiant de session Stripe manquant." });
    }

    const order = await prisma.order.findFirst({
      where: { stripeSessionId: sessionId, userId },
      include: {
        items: {
          include: {
            product: true,
            downloadLinks: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (order.status !== "PAID" || !order.paidAt) {
      return res
        .status(400)
        .json({ message: "Le paiement n'est pas confirmé." });
    }

    const activeDownloadLink = order.items
      .flatMap((item) => item.downloadLinks)
      .find((link) => link.status === "ACTIVE");

    const primaryItem = order.items[0];

    return res.status(200).json({
      order: {
        id: order.id,
        paidAt: order.paidAt,
        currency: order.currency,
        totalPaid: order.totalPaid,
        firstProductName:
          primaryItem?.productNameSnapshot || primaryItem?.product?.name || "",
      },
      download:
        activeDownloadLink && primaryItem
          ? {
              token: activeDownloadLink.token,
              productName:
                primaryItem.productNameSnapshot || primaryItem.product?.name,
            }
          : null,
    });
  } catch (error) {
    console.error("Erreur lors de la confirmation Stripe :", error);
    return res.status(500).json({
      message:
        "Impossible de vérifier la confirmation de paiement. Merci de réessayer.",
    });
  }
}
