import { NewsletterSendLogStatus, Prisma } from "@prisma/client";
import crypto from "crypto";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { sendEmail } from "./mailer";
import { resolveMultipleSegments } from "./newsletter/segmentEngine";
import { recomputeScoresForEmail, computeScoreForSubscriber } from "./newsletter/scoringEngine";

const NEWSLETTER_SECRET =
  process.env.NEWSLETTER_SIGNING_SECRET || process.env.JWT_SECRET || "newsletter-secret";
const DEFAULT_BASE_URL = env.frontendBaseUrl || env.apiBaseUrl || "";

function buildToken(payload: string): string {
  return crypto.createHmac("sha256", NEWSLETTER_SECRET).update(payload).digest("hex");
}

export function buildUnsubscribeToken(email: string): string {
  return buildToken(`unsub:${email}`);
}

export function buildSendLogToken(logId: string, campaignId: string): string {
  return buildToken(`log:${logId}:c:${campaignId}`);
}

function renderHtml(
  html: string,
  subscriber: { email: string; firstName?: string | null; lastName?: string | null },
  campaignId: string,
  logId: string,
  unsubscribeUrl: string
): string {
  let rendered = html
    .replace(/{{\s*firstName\s*}}/gi, subscriber.firstName || "")
    .replace(/{{\s*lastName\s*}}/gi, subscriber.lastName || "")
    .replace(/{{\s*email\s*}}/gi, subscriber.email)
    .replace(/{{\s*unsubscribeUrl\s*}}/gi, unsubscribeUrl);
  const pixelToken = buildSendLogToken(logId, campaignId);
  const pixelUrl = `${env.apiBaseUrl || DEFAULT_BASE_URL}/api/newsletter/open?c=${campaignId}&l=${logId}&t=${pixelToken}`;
  rendered += `\n<img src="${pixelUrl}" alt="" style="display:none" />`;
  return rendered;
}

interface AudienceFilters {
  include?: { tags?: string[]; sources?: string[]; segments?: string[] };
  exclude?: { tags?: string[]; segments?: string[] };
  manualEmails?: string[];
}

export async function resolveAudience(filters: AudienceFilters) {
  const where: Prisma.NewsletterSubscriberWhereInput = {
    status: "ACTIVE",
  };
  if (filters?.include?.tags?.length) {
    where.tags = { hasSome: filters.include.tags };
  }
  if (filters?.include?.sources?.length) {
    where.source = { in: filters.include.sources as any };
  }
  if (filters?.exclude?.tags?.length) {
    where.NOT = [{ tags: { hasSome: filters.exclude.tags } }];
  }
  let subscribers = await prisma.newsletterSubscriber.findMany({ where });

  if (filters?.include?.segments?.length) {
    const allowed = await resolveMultipleSegments(filters.include.segments);
    subscribers = subscribers.filter((s) => allowed.has(s.id));
  }
  if (filters?.exclude?.segments?.length) {
    const blocked = await resolveMultipleSegments(filters.exclude.segments);
    subscribers = subscribers.filter((s) => !blocked.has(s.id));
  }

  const manual = (filters?.manualEmails || []).map((email) => email.toLowerCase().trim()).filter(Boolean);
  const manualSet = new Set(manual);

  return { subscribers, manualEmails: Array.from(manualSet) };
}

export async function sendCampaignNow(campaignId: string): Promise<void> {
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
    include: { template: true },
  });
  if (!campaign) throw new Error("Campagne introuvable");
  const audience = (campaign.audienceJson as AudienceFilters) || {};
  const resolved = await resolveAudience(audience);
  const subscribers = resolved.subscribers;
  const htmlBase =
    campaign.htmlSnapshot || campaign.template?.html || "<p>Contenu indisponible</p>";
  const recipients = [
    ...subscribers.map((s) => ({ subscriber: s, email: s.email })),
    ...resolved.manualEmails.map((email) => ({ subscriber: null, email })),
  ];

  const batch = await prisma.newsletterSendBatch.create({
    data: { campaignId: campaign.id, total: recipients.length, status: "SENDING" },
  });

  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: { status: "SENDING", startedAt: new Date(), totalRecipients: recipients.length },
  });

  for (const recipient of recipients) {
    const log = await prisma.newsletterSendLog.create({
      data: {
        campaignId: campaign.id,
        subscriberId: recipient.subscriber?.id,
        email: recipient.email,
        status: "QUEUED",
      },
    });
    const unsubToken = buildUnsubscribeToken(recipient.email);
    const unsubscribeUrl = `${env.apiBaseUrl || DEFAULT_BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(
      recipient.email
    )}&token=${unsubToken}`;
    const html = renderHtml(
      htmlBase,
      recipient.subscriber || { email: recipient.email, firstName: null, lastName: null },
      campaign.id,
      log.id,
      unsubscribeUrl
    );
    try {
      await sendEmail({
        to: recipient.email,
        subject: campaign.subject,
        html,
      });
      await prisma.newsletterSendLog.update({
        where: { id: log.id },
        data: { status: NewsletterSendLogStatus.SENT, sentAt: new Date() },
      });
      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { sentCount: { increment: 1 } },
      });
    } catch (error: any) {
      await prisma.newsletterSendLog.update({
        where: { id: log.id },
        data: { status: NewsletterSendLogStatus.FAILED, error: error?.message },
      });
      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { bounceCount: { increment: 1 } },
      });
    }
  }

  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: { status: "SENT", finishedAt: new Date() },
  });

  await prisma.newsletterSendBatch.update({
    where: { id: batch.id },
    data: { status: "DONE", finishedAt: new Date(), sent: subscribers.length },
  });
}

export async function scheduleDueCampaigns(): Promise<void> {
  const dueCampaigns = await prisma.newsletterCampaign.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
  });
  for (const campaign of dueCampaigns) {
    await sendCampaignNow(campaign.id);
  }
}

export async function trackOpen(
  campaignId: string,
  logId: string,
  token: string
): Promise<boolean> {
  const expected = buildSendLogToken(logId, campaignId);
  if (expected !== token) return false;
  const log = await prisma.newsletterSendLog.findUnique({ where: { id: logId } });
  if (!log || log.campaignId !== campaignId) return false;
  if (log.status === "OPENED") return true;
  await prisma.newsletterSendLog.update({
    where: { id: logId },
    data: { status: NewsletterSendLogStatus.OPENED, openedAt: new Date() },
  });
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { openCount: { increment: 1 } },
  });
  if (log.subscriberId) {
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id: log.subscriberId } });
    if (subscriber?.userId) {
      await prisma.customerMetrics.updateMany({
        where: { userId: subscriber.userId },
        data: { lastEmailOpenAt: new Date() },
      });
      await recomputeScoresForEmail(subscriber.email);
    } else if (subscriber?.email) {
      await recomputeScoresForEmail(subscriber.email);
    }
  }
  return true;
}

export async function trackClick(token: string): Promise<string | null> {
  const link = await prisma.newsletterLink.findUnique({ where: { token } });
  if (!link) return null;
  await prisma.newsletterLink.update({
    where: { token },
    data: { clickCount: { increment: 1 } },
  });
  await prisma.newsletterCampaign.update({
    where: { id: link.campaignId },
    data: { clickCount: { increment: 1 } },
  });
  const logs = await prisma.newsletterSendLog.findMany({ where: { campaignId: link.campaignId, status: { in: ["SENT", "DELIVERED", "OPENED"] } }, take: 1 });
  if (logs[0]?.subscriberId) {
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id: logs[0].subscriberId } });
    if (subscriber?.userId) {
      await prisma.customerMetrics.updateMany({
        where: { userId: subscriber.userId },
        data: { lastEmailClickAt: new Date() },
      });
      await recomputeScoresForEmail(subscriber.email);
    } else if (subscriber?.email) {
      await recomputeScoresForEmail(subscriber.email);
    }
  }
  return link.originalUrl;
}

export async function unsubscribe(email: string, token: string): Promise<boolean> {
  const expected = buildUnsubscribeToken(email);
  if (expected !== token) return false;
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (!subscriber) return false;
  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });
  await prisma.newsletterConsentLog.create({
    data: {
      subscriberId: subscriber.id,
      action: "OPT_OUT",
      meta: { source: "UNSUBSCRIBE_LINK" },
    },
  });
  await computeScoreForSubscriber(subscriber.id);
  return true;
}

export function startNewsletterWorker() {
  setInterval(() => {
    void scheduleDueCampaigns();
  }, 30000);
}
