import crypto from "crypto";
import { NewsletterPreferenceSource, NewsletterSubscriberStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { hashEmail } from "./scoringEngine";
import { toInputJson } from "./json";

const PREFERENCE_SECRET = process.env.NEWSLETTER_SIGNING_SECRET || process.env.JWT_SECRET || "newsletter-secret";
const TOKEN_VALIDITY_DAYS = 30;

export function buildPreferenceToken(email: string, expiresInDays = TOKEN_VALIDITY_DAYS) {
  const payload = { email: email.toLowerCase(), exp: Date.now() + expiresInDays * 86400000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", PREFERENCE_SECRET).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

function verifyPreferenceToken(token: string) {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", PREFERENCE_SECRET).update(payload).digest("hex");
  if (expected !== sig) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded.email || decoded.exp < Date.now()) return null;
    return decoded as { email: string; exp: number };
  } catch (e) {
    return null;
  }
}

export async function getPreferencesFromToken(token: string) {
  const decoded = verifyPreferenceToken(token);
  if (!decoded) return null;
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email: decoded.email } });
  if (!subscriber) return null;
  return { subscriber, decoded };
}

export async function updatePreferences(
  subscriberId: string,
  newPrefs: any,
  source: NewsletterPreferenceSource,
  unsubscribe?: boolean
) {
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id: subscriberId } });
  if (!subscriber) return null;
  const previous = toInputJson(subscriber.preferencesJson);
  const data: any = { preferencesJson: toInputJson(newPrefs), updatedAt: new Date() };
  if (unsubscribe) {
    data.status = NewsletterSubscriberStatus.UNSUBSCRIBED;
    data.unsubscribedAt = new Date();
  } else if (subscriber.status === NewsletterSubscriberStatus.UNSUBSCRIBED) {
    data.status = NewsletterSubscriberStatus.ACTIVE;
    data.unsubscribedAt = null;
  }
  const updated = await prisma.newsletterSubscriber.update({ where: { id: subscriberId }, data });
  await prisma.newsletterPreferenceLog.create({
    data: {
      subscriberId,
      previousPreferences: previous,
      newPreferences: toInputJson(newPrefs),
      source,
    },
  });
  return updated;
}

export async function hardUnsubscribe(subscriberId: string, source: NewsletterPreferenceSource) {
  const subscriber = await prisma.newsletterSubscriber.update({
    where: { id: subscriberId },
    data: { status: NewsletterSubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
  });
  await prisma.newsletterPreferenceLog.create({
    data: {
      subscriberId,
      previousPreferences: toInputJson(subscriber.preferencesJson),
      newPreferences: toInputJson(subscriber.preferencesJson),
      source,
    },
  });
  return subscriber;
}

export async function anonymizeSubscriber(subscriberId: string) {
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id: subscriberId } });
  if (!subscriber) return null;
  const hashed = hashEmail(subscriber.email);
  const updated = await prisma.newsletterSubscriber.update({
    where: { id: subscriberId },
    data: {
      email: `${hashed}@anon.local`,
      firstName: null,
      lastName: null,
      status: NewsletterSubscriberStatus.ANONYMIZED,
      preferencesJson: Prisma.DbNull,
      tags: [],
      unsubscribedAt: new Date(),
    },
  });
  await prisma.customerActivityEvent.updateMany({ where: { email: subscriber.email }, data: { email: hashed } });
  await prisma.newsletterSendLog.updateMany({ where: { subscriberId }, data: { email: `${hashed}@anon.local` } });
  return updated;
}
