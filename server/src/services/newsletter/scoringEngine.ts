import { CustomerActivityEventType } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../../config/prisma";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function daysBetween(date?: Date | null) {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function computeScoreForSubscriber(subscriberId: string) {
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id: subscriberId } });
  if (!subscriber) return;
  const metrics = subscriber.userId
    ? await prisma.customerMetrics.findUnique({ where: { userId: subscriber.userId } })
    : null;
  const latestLog = await prisma.newsletterSendLog.findFirst({
    where: { subscriberId },
    orderBy: [{ openedAt: "desc" }, { clickedAt: "desc" }, { createdAt: "desc" }],
  });

  const lastOpenAt = latestLog?.openedAt;
  const lastClickAt = latestLog?.clickedAt;
  const lastOrderAt = metrics?.lastOrderAt;
  const lastActivityAt = metrics?.lastActivityAt;

  let score = 0;
  const breakdown: Record<string, number> = {};

  if (daysBetween(lastOpenAt) <= 7) {
    breakdown.emailOpen = 10;
    score += 10;
  }
  if (daysBetween(lastClickAt) <= 7) {
    breakdown.emailClick = 20;
    score += 20;
  }
  if (daysBetween(lastOrderAt) <= 30) {
    breakdown.recentPurchase = 30;
    score += 30;
  }
  if ((metrics?.totalSpent || 0) > 10000) {
    breakdown.highValue = 15;
    score += 15;
  }
  if ((metrics?.ordersCount || 0) > 0) {
    breakdown.buyer = 10;
    score += 10;
  }
  if (daysBetween(lastActivityAt) > 60) {
    breakdown.inactivity = -20;
    score -= 20;
  } else if (daysBetween(lastActivityAt) > 30) {
    breakdown.stale = -10;
    score -= 10;
  }

  score = clamp(score, 0, 100);

  await prisma.newsletterScore.upsert({
    where: { subscriberId },
    update: { score, breakdownJson: breakdown, lastComputedAt: new Date() },
    create: { subscriberId, score, breakdownJson: breakdown },
  });
}

export async function recomputeScoresForUser(userId: string) {
  const subscribers = await prisma.newsletterSubscriber.findMany({ where: { userId } });
  for (const sub of subscribers) {
    await computeScoreForSubscriber(sub.id);
  }
}

export async function recomputeScoresForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const subscribers = await prisma.newsletterSubscriber.findMany({ where: { email: normalized } });
  for (const sub of subscribers) {
    await computeScoreForSubscriber(sub.id);
  }
}

export async function handleScoringEvent(type: CustomerActivityEventType, payload: { userId?: string | null; email?: string | null }) {
  if (payload.userId) {
    await recomputeScoresForUser(payload.userId);
  }
  if (payload.email) {
    await recomputeScoresForEmail(payload.email);
  }
}

export function hashEmail(email: string) {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}
