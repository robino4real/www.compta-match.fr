import { PromoCode } from "@prisma/client";
import { prisma } from "../config/prisma";

export async function validatePromoCodeForTotal(
  rawCode: string,
  totalCents: number
): Promise<{ promo: PromoCode; discountCents: number } | null> {
  if (!rawCode || !rawCode.trim() || totalCents <= 0) {
    return null;
  }

  const normalizedCode = rawCode.trim().toUpperCase();

  const promo = await prisma.promoCode.findUnique({
    where: { code: normalizedCode },
  });

  if (!promo || !promo.isActive) {
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

  if (promo.discountType === "PERCENT") {
    discountCents = Math.floor((totalCents * promo.discountValue) / 100);
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
