import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { validatePromoCodeForTotal } from "../services/promoService";

interface CartItemInput {
  productId: string;
  quantity?: number;
}

async function computeCartTotal(items: CartItemInput[]) {
  const normalized = items.map((raw) => ({
    productId: String(raw.productId),
    quantity: raw.quantity && Number(raw.quantity) > 0 ? Number(raw.quantity) : 1,
  }));

  const productIds = normalized.map((it) => it.productId);
  const products = await prisma.downloadableProduct.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== normalized.length) {
    throw new Error("INVALID_PRODUCTS");
  }

  const productMap = products.reduce<Record<string, (typeof products)[number]>>(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {}
  );

  const totalCents = normalized.reduce((sum, it) => {
    const product = productMap[it.productId];
    if (!product) return sum;
    return sum + product.priceCents * it.quantity;
  }, 0);

  return { totalCents, productMap };
}

export async function applyPromoToCart(req: Request, res: Response) {
  try {
    const { items, code } = req.body as { items?: CartItemInput[]; code?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        errorCode: "EMPTY",
        message: "Votre panier est vide ou invalide.",
      });
    }

    const { totalCents } = await computeCartTotal(items);

    const promoResult = await validatePromoCodeForTotal(code || "", totalCents);

    if (!promoResult) {
      return res.status(400).json({
        ok: false,
        errorCode: "INVALID",
        message: "Ce code promo est invalide ou expiré.",
      });
    }

    const newTotal = Math.max(totalCents - promoResult.discountCents, 0);

    return res.status(200).json({
      ok: true,
      code: promoResult.promo.code,
      discountAmount: promoResult.discountCents,
      newTotal,
      message: "Réduction appliquée avec succès.",
    });
  } catch (error) {
    const isInvalidProducts = error instanceof Error && error.message === "INVALID_PRODUCTS";
    return res.status(isInvalidProducts ? 400 : 500).json({
      ok: false,
      errorCode: isInvalidProducts ? "PRODUCTS" : "SERVER",
      message: isInvalidProducts
        ? "Certains produits du panier sont invalides."
        : "Impossible de valider le code promo pour le moment.",
    });
  }
}

export async function removePromoFromCart(req: Request, res: Response) {
  try {
    const { items } = req.body as { items?: CartItemInput[] };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        errorCode: "EMPTY",
        message: "Votre panier est vide ou invalide.",
      });
    }

    const { totalCents } = await computeCartTotal(items);

    return res.status(200).json({
      ok: true,
      discountAmount: 0,
      newTotal: totalCents,
      message: "Code promo retiré.",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      errorCode: "SERVER",
      message: "Impossible de retirer le code promo pour le moment.",
    });
  }
}
