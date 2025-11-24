import crypto from "crypto";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
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
        totalCents,
        currency: "EUR",
        status: "PAID", // paiement simulé pour le moment
        items: {
          create: normalizedItems.map((it) => ({
            productId: it.productId,
            priceCents: productMap[it.productId].priceCents,
            quantity: it.quantity,
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

    return res.status(201).json({ order });
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
