import { prisma } from "../../config/prisma";

const ATTRIBUTION_WINDOW_DAYS = 7;

export async function attributeRevenue(orderId: string, email?: string | null, amountCents?: number) {
  const normalizedEmail = email?.toLowerCase();
  if (!normalizedEmail) return;
  const windowStart = new Date(Date.now() - ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const log = await prisma.newsletterSendLog.findFirst({
    where: { email: normalizedEmail, clickedAt: { gte: windowStart } },
    orderBy: { clickedAt: "desc" },
  });
  if (!log) return;
  const existing = await prisma.newsletterRevenueAttribution.findFirst({ where: { orderId } });
  if (existing) return existing;
  return prisma.newsletterRevenueAttribution.create({
    data: {
      campaignId: log.campaignId,
      orderId,
      revenue: amountCents ?? 0,
    },
  });
}
