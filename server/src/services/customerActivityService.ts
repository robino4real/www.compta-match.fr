import {
  CustomerActivityEventType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleAutomationEvent } from "./newsletter/automationEngine";
import { handleScoringEvent } from "./newsletter/scoringEngine";

interface TrackEventInput {
  userId?: string | null;
  email?: string | null;
  meta?: Prisma.InputJsonValue;
}

function getSafeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

async function upsertCustomerMetrics(
  userId: string,
  type: CustomerActivityEventType,
  meta?: Prisma.InputJsonValue
) {
  const now = new Date();
  const metrics = await prisma.customerMetrics.findUnique({ where: { userId } });

  const amountCents =
    (meta && typeof meta === "object" && "amount" in meta && Number((meta as any).amount)) || 0;

  if (!metrics) {
    await prisma.customerMetrics.create({
      data: {
        userId,
        lastActivityAt: now,
        lastLoginAt: type === CustomerActivityEventType.USER_LOGIN ? now : null,
        ordersCount: type === CustomerActivityEventType.ORDER_PAID ? 1 : 0,
        totalSpent: type === CustomerActivityEventType.ORDER_PAID ? amountCents : 0,
        lastOrderAt: type === CustomerActivityEventType.ORDER_PAID ? now : null,
        downloadsCount: type === CustomerActivityEventType.DOWNLOAD_USED ? 1 : 0,
      },
    });
    return;
  }

  const data: Prisma.CustomerMetricsUpdateInput = {
    lastActivityAt: now,
  };

  if (type === CustomerActivityEventType.USER_LOGIN) {
    data.lastLoginAt = now;
  }

  if (type === CustomerActivityEventType.ORDER_PAID) {
    data.ordersCount = { increment: 1 };
    data.totalSpent = { increment: amountCents };
    data.lastOrderAt = now;
  }

  if (type === CustomerActivityEventType.DOWNLOAD_USED) {
    data.downloadsCount = { increment: 1 };
  }

  await prisma.customerMetrics.update({
    where: { userId },
    data,
  });
}

export async function trackCustomerEvent(
  type: CustomerActivityEventType,
  payload: TrackEventInput
) {
  const { userId, email, meta } = payload;
  const normalizedEmail = getSafeEmail(email);

  await prisma.customerActivityEvent.create({
    data: {
      type,
      userId: userId || null,
      email: normalizedEmail,
      meta: meta || {},
    },
  });

  if (userId) {
    await upsertCustomerMetrics(userId, type, meta);
  }

  await handleAutomationEvent(type, { userId, email: normalizedEmail || undefined, meta: meta as any });
  await handleScoringEvent(type, { userId, email: normalizedEmail || undefined });
}
