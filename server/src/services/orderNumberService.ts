import crypto from "crypto";
import { OrderType, SubscriptionBrand } from "@prisma/client";
import { prisma } from "../config/prisma";

const ORDER_NUMBER_PATTERN = /^(PT|CP|CA)\d{10}$/;

function buildPrefix(orderType: OrderType, subscriptionBrand?: SubscriptionBrand | null) {
  if (orderType === OrderType.DOWNLOADABLE) {
    return "PT";
  }

  if (!subscriptionBrand) {
    throw new Error("Subscription brand is required for subscription orders");
  }

  return subscriptionBrand === SubscriptionBrand.CA ? "CA" : "CP";
}

function generateNumericSuffix() {
  const suffixNumber = crypto.randomInt(0, 10_000_000_000);
  return String(suffixNumber).padStart(10, "0");
}

export function isOrderNumberValid(orderNumber?: string | null) {
  if (!orderNumber) return false;
  return ORDER_NUMBER_PATTERN.test(orderNumber.trim());
}

export async function generateOrderNumber(
  orderType: OrderType,
  subscriptionBrand?: SubscriptionBrand | null,
  maxAttempts = 10
): Promise<string> {
  const prefix = buildPrefix(orderType, subscriptionBrand);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = `${prefix}${generateNumericSuffix()}`;
    const existing = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique order number after multiple attempts");
}
