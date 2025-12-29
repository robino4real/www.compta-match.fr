import { CustomerMetrics, NewsletterSegment, NewsletterSubscriber } from "@prisma/client";
import { prisma } from "../../config/prisma";

export type SegmentRules = {
  operator?: "AND" | "OR";
  conditions?: Array<{
    field: string;
    op: string;
    value?: any;
  }>;
  groups?: SegmentRules[];
};

interface SubscriberContext {
  subscriber: NewsletterSubscriber;
  metrics?: CustomerMetrics | null;
  lastEmailOpenAt?: Date | null;
  lastEmailClickAt?: Date | null;
}

function getFieldValue(ctx: SubscriberContext, field: string): any {
  switch (field) {
    case "status":
      return ctx.subscriber.status;
    case "source":
      return ctx.subscriber.source;
    case "tags":
      return ctx.subscriber.tags || [];
    case "createdAt":
      return ctx.subscriber.createdAt;
    case "ordersCount":
      return ctx.metrics?.ordersCount ?? 0;
    case "totalSpent":
      return ctx.metrics?.totalSpent ?? 0;
    case "lastOrderAt":
      return ctx.metrics?.lastOrderAt ?? null;
    case "lastLoginAt":
      return ctx.metrics?.lastLoginAt ?? null;
    case "downloadsCount":
      return ctx.metrics?.downloadsCount ?? 0;
    case "lastEmailOpenAt":
      return ctx.lastEmailOpenAt ?? ctx.metrics?.lastEmailOpenAt ?? null;
    case "lastEmailClickAt":
      return ctx.lastEmailClickAt ?? ctx.metrics?.lastEmailClickAt ?? null;
    default:
      return null;
  }
}

function coerceDate(value: any): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function evaluateCondition(condition: { field: string; op: string; value?: any }, ctx: SubscriberContext) {
  const fieldValue = getFieldValue(ctx, condition.field);
  const op = condition.op?.toUpperCase();
  const value = condition.value;

  if (op === "IS_NULL") return fieldValue === null || fieldValue === undefined;
  if (op === "NOT_NULL") return fieldValue !== null && fieldValue !== undefined;

  if (op === "LAST_X_DAYS") {
    const days = Number(value) || 0;
    const dateVal = coerceDate(fieldValue);
    if (!dateVal) return false;
    const limit = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return dateVal >= limit;
  }

  if (op === "BETWEEN") {
    if (!Array.isArray(value) || value.length < 2) return false;
    const start = typeof value[0] === "number" ? value[0] : coerceDate(value[0]);
    const end = typeof value[1] === "number" ? value[1] : coerceDate(value[1]);
    if (fieldValue instanceof Date || start instanceof Date || end instanceof Date) {
      const fv = coerceDate(fieldValue);
      if (!fv || !(start instanceof Date) || !(end instanceof Date)) return false;
      return fv >= start && fv <= end;
    }
    return fieldValue >= start && fieldValue <= end;
  }

  if (op === "IN") {
    if (Array.isArray(fieldValue)) {
      return fieldValue.some((v) => (value || []).includes(v));
    }
    return Array.isArray(value) && value.includes(fieldValue);
  }
  if (op === "NOT_IN") {
    if (Array.isArray(fieldValue)) {
      return !fieldValue.some((v) => (value || []).includes(v));
    }
    return !(Array.isArray(value) && value.includes(fieldValue));
  }

  switch (op) {
    case "=":
      return fieldValue === value;
    case "!=":
      return fieldValue !== value;
    case ">":
      return fieldValue > value;
    case "<":
      return fieldValue < value;
    case ">=":
      return fieldValue >= value;
    case "<=":
      return fieldValue <= value;
    default:
      return false;
  }
}

function evaluateRules(rules: SegmentRules, ctx: SubscriberContext): boolean {
  const operator = (rules.operator || "AND").toUpperCase();
  const results: boolean[] = [];

  if (rules.conditions) {
    for (const condition of rules.conditions) {
      results.push(evaluateCondition(condition, ctx));
    }
  }
  if (rules.groups) {
    for (const group of rules.groups) {
      results.push(evaluateRules(group, ctx));
    }
  }

  if (!results.length) return true;
  return operator === "OR" ? results.some(Boolean) : results.every(Boolean);
}

async function buildContexts(): Promise<SubscriberContext[]> {
  const subscribers = await prisma.newsletterSubscriber.findMany({});
  const userIds = subscribers.map((s) => s.userId).filter(Boolean) as string[];
  const metrics = await prisma.customerMetrics.findMany({ where: { userId: { in: userIds } } });
  const metricsMap = new Map<string, CustomerMetrics>();
  metrics.forEach((m) => metricsMap.set(m.userId, m));

  const sendLogAgg = await prisma.newsletterSendLog.groupBy({
    by: ["subscriberId"],
    _max: { openedAt: true, clickedAt: true },
  });
  const openMap = new Map<string, { openedAt: Date | null; clickedAt: Date | null }>();
  sendLogAgg.forEach((row) => {
    if (row.subscriberId) {
      openMap.set(row.subscriberId, { openedAt: row._max.openedAt, clickedAt: row._max.clickedAt });
    }
  });

  return subscribers.map((subscriber) => {
    const metricsEntry = subscriber.userId ? metricsMap.get(subscriber.userId) : undefined;
    const agg = openMap.get(subscriber.id);
    return {
      subscriber,
      metrics: metricsEntry,
      lastEmailOpenAt: agg?.openedAt ?? null,
      lastEmailClickAt: agg?.clickedAt ?? null,
    };
  });
}

export async function resolveSegmentSubscribers(segmentId: string): Promise<string[]> {
  const segment = await prisma.newsletterSegment.findUnique({ where: { id: segmentId } });
  if (!segment) return [];
  const rules = (segment.rulesJson as SegmentRules) || {};
  const contexts = await buildContexts();
  const matching = contexts.filter((ctx) => evaluateRules(rules, ctx)).map((ctx) => ctx.subscriber.id);

  await prisma.$transaction([
    prisma.newsletterSegmentCache.deleteMany({ where: { segmentId } }),
    matching.length
      ? prisma.newsletterSegmentCache.createMany({
          data: matching.map((subscriberId) => ({ segmentId, subscriberId })),
          skipDuplicates: true,
        })
      : prisma.newsletterSegmentCache.createMany({ data: [] }),
    prisma.newsletterSegment.update({ where: { id: segmentId }, data: { previewCount: matching.length } }),
  ]);
  return matching;
}

export async function previewSegment(segmentId: string): Promise<number> {
  const segment = await prisma.newsletterSegment.findUnique({ where: { id: segmentId } });
  if (!segment) return 0;
  const rules = (segment.rulesJson as SegmentRules) || {};
  const contexts = await buildContexts();
  return contexts.filter((ctx) => evaluateRules(rules, ctx)).length;
}

export async function recomputeSegments() {
  const segments = await prisma.newsletterSegment.findMany();
  for (const segment of segments) {
    await resolveSegmentSubscribers(segment.id);
  }
}

export async function isSubscriberInSegment(subscriberId: string, segment: NewsletterSegment): Promise<boolean> {
  const cached = await prisma.newsletterSegmentCache.findFirst({ where: { segmentId: segment.id, subscriberId } });
  if (cached) return true;
  const contexts = await buildContexts();
  const ctx = contexts.find((c) => c.subscriber.id === subscriberId);
  if (!ctx) return false;
  return evaluateRules((segment.rulesJson as SegmentRules) || {}, ctx);
}

export async function resolveMultipleSegments(segmentIds: string[]): Promise<Set<string>> {
  if (!segmentIds.length) return new Set();
  const caches = await prisma.newsletterSegmentCache.findMany({ where: { segmentId: { in: segmentIds } } });
  const ids = new Set<string>();
  caches.forEach((row) => ids.add(row.subscriberId));
  if (ids.size) return ids;
  for (const id of segmentIds) {
    const computed = await resolveSegmentSubscribers(id);
    computed.forEach((s) => ids.add(s));
  }
  return ids;
}

export function evaluateRulesForContext(rules: SegmentRules, ctx: SubscriberContext): boolean {
  return evaluateRules(rules, ctx);
}

export async function buildContextForSubscriber(subscriber: NewsletterSubscriber): Promise<SubscriberContext> {
  const metrics = subscriber.userId
    ? await prisma.customerMetrics.findUnique({ where: { userId: subscriber.userId } })
    : null;
  const sendLog = await prisma.newsletterSendLog.groupBy({
    by: ["subscriberId"],
    where: { subscriberId: subscriber.id },
    _max: { openedAt: true, clickedAt: true },
  });
  const agg = sendLog[0];
  return {
    subscriber,
    metrics: metrics || undefined,
    lastEmailOpenAt: agg?._max.openedAt ?? null,
    lastEmailClickAt: agg?._max.clickedAt ?? null,
  };
}
