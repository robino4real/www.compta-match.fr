import crypto from "crypto";
import { Request, Response } from "express";
import { CustomerActivityEventType, OrderType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { generateDownloadLinksForOrder } from "../services/downloadLinkService";
import { generateOrderNumber } from "../services/orderNumberService";
import { sendOrderConfirmationEmail } from "../services/transactionalEmailService";
import { trackCustomerEvent } from "../services/customerActivityService";
import { attributeRevenue } from "../services/newsletter/revenueService";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

function generateOrderDownloadToken() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return crypto.randomBytes(32).toString("hex");
}

export async function createDownloadableOrder(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  try {
    const userId = request.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    const { items } = request.body as {
      items?: { productId: string; quantity?: number }[];
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

    const productMap = products.reduce<Record<string, (typeof products)[number]>>(
      (acc, p) => {
        acc[p.id] = p;
        return acc;
      },
      {}
    );

    const totalCents = normalizedItems.reduce((sum, it) => {
      const product = productMap[it.productId];
      if (!product) return sum;
      return sum + product.priceCents * it.quantity;
    }, 0);

    if (totalCents <= 0) {
      return res.status(400).json({
        message: "Le montant total de la commande est invalide.",
      });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: await generateOrderNumber(OrderType.DOWNLOADABLE),
        orderType: OrderType.DOWNLOADABLE,
        totalBeforeDiscount: totalCents,
        discountAmount: 0,
        totalPaid: totalCents,
        currency: "EUR",
        paidAt: new Date(),
        status: "PAID", // paiement simulé pour le moment
        downloadToken: generateOrderDownloadToken(),
        items: {
          create: normalizedItems.map((it) => ({
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

    await trackCustomerEvent(CustomerActivityEventType.ORDER_CREATED, {
      userId,
      email: request.user?.email,
      meta: { amount: totalCents, currency: "EUR", orderId: order.id },
    });

    await trackCustomerEvent(CustomerActivityEventType.ORDER_PAID, {
      userId,
      email: request.user?.email,
      meta: { amount: totalCents, currency: "EUR", orderId: order.id },
    });

    await attributeRevenue(order.id, request.user?.email, totalCents);

    await generateDownloadLinksForOrder(order.id, userId);

    const orderWithLinks = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { downloadLinks: true, product: true } },
        invoice: true,
        promoCode: true,
      },
    });

    await sendOrderConfirmationEmail(order.id);

    return res.status(201).json({ order: orderWithLinks });
  } catch (error) {
    console.error(
      "Erreur lors de la création d'une commande de produits téléchargeables :",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la création de la commande de produits téléchargeables.",
    });
  }
}

export async function listUserOrders(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  try {
    const userId = request.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { downloadLinks: true } },
        invoice: true,
        promoCode: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des commandes utilisateur :",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la récupération de vos commandes.",
    });
  }
}

export async function getOrderByStripeSession(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const userId = request.user?.id;
  const { sessionId } = req.params as { sessionId: string };

  if (!userId) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  if (!sessionId) {
    return res.status(400).json({ message: "Identifiant de session manquant." });
  }

  const order = await prisma.order.findFirst({
    where: { stripeSessionId: sessionId, userId },
    include: {
      items: { include: { downloadLinks: true, product: true } },
      invoice: true,
    },
  });

  if (!order) {
    return res.status(202).json({ message: "Commande en validation." });
  }

  const activeDownloadLink = order.items
    .flatMap((item) => item.downloadLinks)
    .find((link) => link.status === "ACTIVE");

  const primaryItem = order.items[0];

  return res.json({
    status: order.status,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
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
}
