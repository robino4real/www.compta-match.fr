import { Request, Response } from "express";
import { validatePromoCodeForTotal } from "../services/promoService";
import { computeCartTotals, CartItemInput } from "../services/cartService";

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

    const { totalCents, totalsByCategory } = await computeCartTotals(items);

    const promoResult = await validatePromoCodeForTotal(code || "", totalCents, {
      context: "PRODUCT",
      categoryTotals: totalsByCategory,
    });

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
    const isInvalidBinary = error instanceof Error && error.message === "INVALID_BINARY";
    return res.status(isInvalidProducts || isInvalidBinary ? 400 : 500).json({
      ok: false,
      errorCode: isInvalidProducts ? "PRODUCTS" : isInvalidBinary ? "BINARY" : "SERVER",
      message: isInvalidProducts
        ? "Certains produits du panier sont invalides."
        : isInvalidBinary
        ? "La version sélectionnée pour un logiciel n'est plus disponible."
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

    const { totalCents } = await computeCartTotals(items);

    return res.status(200).json({
      ok: true,
      discountAmount: 0,
      newTotal: totalCents,
      message: "Code promo retiré.",
    });
  } catch (error) {
    const isInvalidBinary = error instanceof Error && error.message === "INVALID_BINARY";
    const isInvalidProducts = error instanceof Error && error.message === "INVALID_PRODUCTS";
    return res.status(isInvalidBinary || isInvalidProducts ? 400 : 500).json({
      ok: false,
      errorCode: isInvalidBinary || isInvalidProducts ? "BINARY" : "SERVER",
      message: isInvalidBinary || isInvalidProducts
        ? "Certains logiciels ne sont plus disponibles."
        : "Impossible de retirer le code promo pour le moment.",
    });
  }
}
