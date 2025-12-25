import crypto from "crypto";
import { Request, Response } from "express";
import { DownloadPlatform, PromoCode } from "@prisma/client";
import { prisma } from "../config/prisma";
import { stripe } from "../config/stripeClient";
import { createInvoiceForOrder } from "../services/invoiceService";
import { generateDownloadLinksForOrder } from "../services/downloadLinkService";
import { validatePromoCodeForTotal } from "../services/promoService";
import { computeCartTotals, CartItemInput } from "../services/cartService";
import {
  sendInvoiceAvailableEmail,
  sendOrderConfirmationEmail,
} from "../services/transactionalEmailService";
import { env } from "../config/env";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
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

function buildFreeOrderSuccessUrl(baseUrl: string, orderId: string): string {
  const cleanedBase = baseUrl.replace(/([?&])session_id=\{CHECKOUT_SESSION_ID\}/, "");
  const separator = cleanedBase.includes("?") ? "&" : "?";
  return `${cleanedBase}${separator}order_id=${encodeURIComponent(orderId)}`;
}

function buildOrderItemsPayload(
  normalizedItems: { productId: string; quantity: number; binaryId?: string | null; platform?: DownloadPlatform | null }[],
  productMap: Record<string, Awaited<ReturnType<typeof prisma.downloadableProduct.findMany>>[number]>
) {
  return normalizedItems.map((it) => ({
    productId: it.productId,
    productNameSnapshot: productMap[it.productId].name,
    priceCents: productMap[it.productId].priceCents,
    quantity: it.quantity,
    lineTotal: productMap[it.productId].priceCents * it.quantity,
    binaryId: it.binaryId,
    platform: it.platform,
  }));
}

function generateOrderDownloadToken() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return crypto.randomBytes(32).toString("hex");
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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const { items, promoCode, billing, acceptedTerms, acceptedLicense } =
      req.body as {
        items?: CartItemInput[];
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

    let cartComputation;
    try {
      cartComputation = await computeCartTotals(items);
    } catch (error) {
      const isInvalidProducts =
        error instanceof Error && error.message === "INVALID_PRODUCTS";

      return res.status(isInvalidProducts ? 400 : 500).json({
        message: isInvalidProducts
          ? "Certains produits demandés sont introuvables ou ne sont plus disponibles."
          : "Impossible de calculer le panier pour le paiement.",
      });
    }

    const { totalCents, totalsByCategory, normalizedItems, productMap } = cartComputation;

    let appliedPromo: PromoCode | null = null;
    let promoDiscountCents = 0;

    if (promoCode && promoCode.trim()) {
      const result = await validatePromoCodeForTotal(promoCode, totalCents, {
        context: "PRODUCT",
        categoryTotals: totalsByCategory,
      });

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

    const billingName = `${billingInfo.firstName} ${billingInfo.lastName}`.trim();
    const billingAddress = buildBillingAddress(billingInfo);

    const frontendBaseUrl = env.frontendBaseUrl.replace(/\/$/, "");
    const baseSuccessUrl =
      process.env.STRIPE_SUCCESS_URL || `${frontendBaseUrl}/checkout/success`;
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL || `${frontendBaseUrl}/checkout/cancel`;

    if (payableCents <= 0) {
      const currency =
        productMap[normalizedItems[0].productId]?.currency?.toUpperCase() ||
        (process.env.CURRENCY || "EUR").toUpperCase();

      const order = await prisma.order.create({
        data: {
          userId,
          totalBeforeDiscount: totalCents,
          discountAmount: promoDiscountCents > 0 ? promoDiscountCents : 0,
          totalPaid: 0,
          currency,
          status: "PAID",
          paidAt: new Date(),
          downloadToken: generateOrderDownloadToken(),
          promoCodeId: appliedPromo ? appliedPromo.id : null,
          billingNameSnapshot: billingName,
          billingEmailSnapshot: billingInfo.email,
          billingAddressSnapshot: billingAddress || null,
          acceptedTerms,
          acceptedLicense,
          items: {
            create: buildOrderItemsPayload(normalizedItems, productMap),
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
        billingEmail: billingInfo.email,
        billingName,
        billingAddress,
      });

      if (appliedPromo && promoDiscountCents > 0) {
        await prisma.promoCode.update({
          where: { id: appliedPromo.id },
          data: {
            currentUses: {
              increment: 1,
            },
          },
        });
      }

      await sendOrderConfirmationEmail(order.id);
      if (invoice) {
        await sendInvoiceAvailableEmail(invoice.id);
      }

      const successUrl = buildFreeOrderSuccessUrl(baseSuccessUrl, order.id);
      return res.status(201).json({ url: successUrl });
    }

    // On stocke les infos nécessaires dans metadata pour les récupérer dans le webhook
    const currency = (process.env.CURRENCY || "eur").toLowerCase();

    const order = await prisma.order.create({
      data: {
        userId,
        totalBeforeDiscount: totalCents,
        discountAmount: promoDiscountCents > 0 ? promoDiscountCents : 0,
        totalPaid: payableCents,
        currency: currency.toUpperCase(),
        status: "PENDING",
        downloadToken: null,
        promoCodeId: appliedPromo ? appliedPromo.id : null,
        billingNameSnapshot: billingName,
        billingEmailSnapshot: billingInfo.email,
        billingAddressSnapshot: billingAddress || null,
        acceptedTerms,
        acceptedLicense,
        items: { create: buildOrderItemsPayload(normalizedItems, productMap) },
      },
      include: { items: true },
    });

    const metadata = {
      userId,
      orderId: order.id,
      items: JSON.stringify(
        normalizedItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          binaryId: it.binaryId || "",
          platform: it.platform || "",
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

    const successUrl = buildSuccessUrl(baseSuccessUrl);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
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

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
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


export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string | undefined;
  const correlationId = `stripe-${Date.now()}`;

  if (!env.stripeWebhookSecret) {
    console.error(
      "[Stripe webhook] Secret manquant dans l'env. Ignoré.",
      correlationId
    );
    return res.status(500).json({ received: true });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      (req as any).body,
      signature || "",
      env.stripeWebhookSecret
    );

    console.log("[Stripe webhook] received", event.type, correlationId);

    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ received: true });
    }

    const session = event.data?.object as any;
    const metadata = session?.metadata || {};
    const userId = metadata.userId as string | undefined;
    const orderId = metadata.orderId as string | undefined;
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
        session?.id,
        correlationId
      );
      return res.status(200).json({ received: true });
    }

    const normalizePlatform = (
      value: unknown
    ): DownloadPlatform | undefined => {
      if (typeof value !== "string") return undefined;
      const upper = value.trim().toUpperCase();
      return upper === "WINDOWS" || upper === "MACOS"
        ? (upper as DownloadPlatform)
        : undefined;
    };

    let parsedItems: {
      productId: string;
      quantity: number;
      binaryId?: string | null;
      platform?: DownloadPlatform | null;
    }[] = [];
    try {
      const raw = JSON.parse(itemsJson);
      if (Array.isArray(raw)) {
        parsedItems = raw.map((it: any) => ({
          productId: String(it.productId),
          quantity:
            it.quantity && Number(it.quantity) > 0
              ? Number(it.quantity)
              : 1,
          binaryId: it.binaryId ? String(it.binaryId) : null,
          platform: normalizePlatform(it.platform) || null,
        }));
      }
    } catch (err) {
      console.error(
        "[Stripe webhook] Impossible de parser metadata.items :",
        err,
        correlationId
      );
      return res.status(200).json({ received: true });
    }

    if (parsedItems.length === 0) {
      console.error(
        "[Stripe webhook] Liste des produits vide après parsing metadata.items.",
        correlationId
      );
      return res.status(200).json({ received: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error(
        "[Stripe webhook] Utilisateur introuvable pour userId :",
        userId,
        correlationId
      );
      return res.status(200).json({ received: true });
    }

    const productIds = parsedItems.map((it) => it.productId);

    const products = await prisma.downloadableProduct.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: { binaries: true },
    });

    if (products.length === 0) {
      console.error(
        "[Stripe webhook] Aucun produit valide trouvé pour la commande. userId :",
        userId,
        correlationId
      );
      return res.status(200).json({ received: true });
    }

    const productMap = products.reduce<
      Record<string, (typeof products)[number]>
    >((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const hasInvalidBinary = parsedItems.some((item) => {
      const product = productMap[item.productId];
      if (!product) return true;

      if (!product.binaries?.length) return false;

      if (item.binaryId) {
        return !product.binaries.some((binary) => binary.id === item.binaryId);
      }

      if (item.platform) {
        return !product.binaries.some(
          (binary) => binary.platform === item.platform
        );
      }

      return false;
    });

    if (hasInvalidBinary) {
      console.error(
        "[Stripe webhook] Binaire sélectionné introuvable pour la commande. userId :",
        userId,
        correlationId
      );
      return res.status(200).json({ received: true });
    }

    const payableCents = session.amount_total || 0;
    const currency =
      (session.currency as string | undefined)?.toUpperCase() ||
      products[0]?.currency ||
      "EUR";

    let order = orderId
      ? await prisma.order.findUnique({ where: { id: orderId } })
      : null;

    if (!order && session?.id) {
      order = await prisma.order.findFirst({
        where: { stripeSessionId: session.id },
      });
    }

    if (order && order.status === "PAID") {
      return res.status(200).json({ received: true });
    }

    if (!order) {
      order = await prisma.order.create({
        data: {
          userId,
          totalBeforeDiscount: payableCents,
          discountAmount: promoDiscountCents > 0 ? promoDiscountCents : 0,
          totalPaid: payableCents,
          currency,
          status: "PENDING",
          promoCodeId: promoCodeId || null,
          stripeSessionId: session?.id || null,
          stripePaymentIntentId:
            typeof session?.payment_intent === "string"
              ? session.payment_intent
              : null,
          acceptedTerms,
          acceptedLicense,
          billingNameSnapshot: billingNameFromMetadata || null,
          billingEmailSnapshot: billingEmailFromMetadata || null,
          billingAddressSnapshot: billingAddressFromMetadata || null,
          items: { create: buildOrderItemsPayload(parsedItems, productMap) },
        },
      });
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    if (orderItems.length === 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          items: { create: buildOrderItemsPayload(parsedItems, productMap) },
        },
      });
    }

    const orderUpdatePayload: any = {
      status: "PAID",
      paidAt: new Date(),
      stripeSessionId: session?.id || order.stripeSessionId,
      stripePaymentIntentId:
        typeof session?.payment_intent === "string"
          ? session.payment_intent
          : order.stripePaymentIntentId,
      totalPaid: payableCents || order.totalPaid,
      currency,
      billingNameSnapshot:
        order.billingNameSnapshot || billingNameFromMetadata || null,
      billingEmailSnapshot:
        order.billingEmailSnapshot || billingEmailFromMetadata || null,
      billingAddressSnapshot:
        order.billingAddressSnapshot || billingAddressFromMetadata || null,
    };

    await prisma.order.update({
      where: { id: order.id },
      data: orderUpdatePayload,
    });

    await generateDownloadLinksForOrder(order.id, userId);

    const orderWithRelations = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, invoice: true },
    });

    let invoice = orderWithRelations?.invoice || null;
    if (!invoice && orderWithRelations) {
      invoice = await createInvoiceForOrder({
        order: orderWithRelations,
        user,
        billingEmail:
          billingEmailFromMetadata || orderWithRelations.billingEmailSnapshot ||
          user.email,
        billingName:
          billingNameFromMetadata || orderWithRelations.billingNameSnapshot ||
          undefined,
        billingAddress:
          billingAddressFromMetadata || orderWithRelations.billingAddressSnapshot,
      });
    }

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
          promoCodeUsed,
          correlationId
        );
      }
    }

    await sendOrderConfirmationEmail(order.id);
    if (invoice) {
      await sendInvoiceAvailableEmail(invoice.id);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] Erreur dans le handler :", error);
    return res.status(400).json({ received: false });
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
    const orderId = req.query.order_id as string | undefined;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    if ((!sessionId || !sessionId.trim()) && (!orderId || !orderId.trim())) {
      return res
        .status(400)
        .json({ message: "Identifiant de paiement manquant." });
    }

    const order = await prisma.order.findFirst({
      where: orderId
        ? { id: orderId, userId }
        : { stripeSessionId: sessionId || "", userId },
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
      return res.status(202).json({ message: "Commande en cours de validation." });
    }

    if (order.status !== "PAID" || !order.paidAt) {
      return res
        .status(202)
        .json({ message: "Paiement en cours de validation.", status: order.status });
    }

    const activeDownloadLink = order.items
      .flatMap((item) => item.downloadLinks)
      .find((link) => link.status === "ACTIVE");

    const primaryItem = order.items[0];

    return res.status(200).json({
      status: order.status,
      order: {
        id: order.id,
        paidAt: order.paidAt,
        currency: order.currency,
        totalPaid: order.totalPaid,
        firstProductName:
          primaryItem?.productNameSnapshot || primaryItem?.product?.name || "",
      },
      orderDownloadToken: order.downloadToken,
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
