import { PromoCode } from "@prisma/client";
import { prisma } from "../config/prisma";

export const NO_CATEGORY_KEY = "__NO_CATEGORY__";

export function buildCategoryKey(categoryId?: string | null) {
  return categoryId ?? NO_CATEGORY_KEY;
}

export async function validatePromoCodeForTotal(
  rawCode: string,
  totalCents: number,
  options?: {
    context?: "PRODUCT" | "SUBSCRIPTION";
    categoryTotals?: Record<string, number>;
  }
): Promise<{ promo: PromoCode; discountCents: number } | null> {
  if (!rawCode || !rawCode.trim() || totalCents <= 0) {
    return null;
  }

  const context = options?.context || "PRODUCT";

  const normalizedCode = rawCode.trim().toUpperCase();

  const promo = await prisma.promoCode.findUnique({
    where: { code: normalizedCode },
  });

  if (!promo || !promo.isActive) {
    return null;
  }

  const targetType =
    promo.targetType === "ALL" ||
    promo.targetType === "PRODUCT" ||
    promo.targetType === "CATEGORY"
      ? promo.targetType
      : "ALL";

  if (
    (targetType === "PRODUCT" || targetType === "CATEGORY") &&
    context !== "PRODUCT"
  ) {
    return null;
  }

  const now = new Date();

  if (promo.startsAt && promo.startsAt > now) {
    return null;
  }

  if (promo.endsAt && promo.endsAt < now) {
    return null;
  }

  if (
    typeof promo.maxUses === "number" &&
    promo.maxUses > 0 &&
    promo.currentUses >= promo.maxUses
  ) {
    return null;
  }

  let discountCents = 0;

  let eligibleBase = totalCents;

  if (targetType === "CATEGORY") {
    const categoryTotals = options?.categoryTotals;
    eligibleBase = promo.productCategoryId
      ? categoryTotals?.[promo.productCategoryId] || 0
      : 0;
  } else if (targetType === "PRODUCT") {
    const categoryTotals = options?.categoryTotals;
    eligibleBase = promo.productCategoryId
      ? categoryTotals?.[promo.productCategoryId] || 0
      : totalCents;
  }

  if (eligibleBase <= 0) {
    return null;
  }

  if (promo.discountType === "PERCENT") {
    discountCents = Math.floor((eligibleBase * promo.discountValue) / 100);
  } else if (promo.discountType === "AMOUNT") {
    discountCents = promo.discountValue;
  }

  if (discountCents <= 0) {
    return null;
  }

  if (discountCents > totalCents) {
    discountCents = totalCents;
  }

  return { promo, discountCents };
}
