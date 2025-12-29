import { Request, Response } from "express";
import {
  NewsletterSubscriberStatus,
  NewsletterSubscriberSource,
  NewsletterConsentAction,
  Prisma,
} from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../config/prisma";

const SORT_MAPPING: Record<string, Prisma.NewsletterSubscriberOrderByWithRelationInput> = {
  createdat_desc: { createdAt: "desc" },
  createdat_asc: { createdAt: "asc" },
  email_asc: { email: "asc" },
};

const STATUS_VALUES = new Set(
  Object.values(NewsletterSubscriberStatus).map((value) => value.toUpperCase())
);
const SOURCE_VALUES = new Set(
  Object.values(NewsletterSubscriberSource).map((value) => value.toUpperCase())
);

function isValidEmail(email?: string | null) {
  if (!email) return false;
  return /\S+@\S+\.\S+/.test(email);
}

function parseDateParam(dateString?: string | null): Date | undefined {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}/.test(dateString)) return undefined;
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function sanitizeTags(input?: string | string[]) {
  if (!input) return [] as string[];
  if (Array.isArray(input)) return input.map((t) => String(t).trim()).filter(Boolean);
  return input
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeStatus(value?: string | null): NewsletterSubscriberStatus {
  const normalized = (value || "").toUpperCase();
  if (STATUS_VALUES.has(normalized)) {
    return normalized as NewsletterSubscriberStatus;
  }
  return NewsletterSubscriberStatus.ACTIVE;
}

function normalizeSource(value?: string | null): NewsletterSubscriberSource {
  const normalized = (value || "").toUpperCase();
  if (SOURCE_VALUES.has(normalized)) {
    return normalized as NewsletterSubscriberSource;
  }
  return NewsletterSubscriberSource.ADMIN_MANUAL;
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (cells[idx] || "").trim();
    });
    return row;
  });
}

function buildListWhere(req: Request): Prisma.NewsletterSubscriberWhereInput {
  const { q, status, source, from, to } = req.query as Record<string, string | undefined>;
  const where: Prisma.NewsletterSubscriberWhereInput = {};
  const search = (q || "").trim();

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  const normalizedStatus = normalizeStatus(status || undefined);
  if (status && STATUS_VALUES.has(normalizedStatus)) {
    where.status = normalizedStatus;
  }

  const normalizedSource = normalizeSource(source || undefined);
  if (source && SOURCE_VALUES.has(normalizedSource)) {
    where.source = normalizedSource;
  }

  const fromDate = parseDateParam(from);
  const toDate = parseDateParam(to);

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) } : {}),
    };
  }

  return where;
}

export async function listSubscribers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 200);
  const sortParam = ((req.query.sort as string) || "createdAt_desc").toLowerCase();
  const orderBy = SORT_MAPPING[sortParam] || SORT_MAPPING.createdat_desc;

  try {
    const where = buildListWhere(req);
    const total = await prisma.newsletterSubscriber.count({ where });
    const items = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { score: true },
    });

    return res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("[newsletter] list subscribers error", error);
    return res.status(500).json({ message: "Impossible de charger les abonnés" });
  }
}

export async function createSubscriber(req: Request, res: Response) {
  const { email, firstName, lastName, status, source, tags, consentSource, consentProof } =
    req.body ?? {};

  const normalizedEmail = (email || "").toLowerCase().trim();
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: "Email invalide" });
  }

  const subscriberStatus = normalizeStatus(status);
  const subscriberSource = normalizeSource(source);
  const parsedTags = sanitizeTags(tags);
  const consentAt = new Date();

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        status: subscriberStatus,
        source: subscriberSource,
        consentAt,
        consentSource: consentSource?.trim() || "admin",
        consentProof: consentProof || {},
        userId: existingUser?.id || null,
        tags: parsedTags,
      },
    });

    if (subscriberStatus === NewsletterSubscriberStatus.ACTIVE) {
      await prisma.newsletterConsentLog.create({
        data: {
          subscriberId: subscriber.id,
          action: NewsletterConsentAction.OPT_IN,
          timestamp: consentAt,
          meta: { source: subscriberSource },
        },
      });
    }

    return res.status(201).json(subscriber);
  } catch (error) {
    console.error("[newsletter] create subscriber error", error);
    return res.status(500).json({ message: "Impossible de créer l'abonné" });
  }
}

export async function updateSubscriber(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { firstName, lastName, status, source, tags } = req.body ?? {};

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!subscriber) return res.status(404).json({ message: "Abonné introuvable" });

    const newStatus = status ? normalizeStatus(status) : subscriber.status;
    const newSource = source ? normalizeSource(source) : subscriber.source;
    const parsedTags = sanitizeTags(tags ?? subscriber.tags);

    const updated = await prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        firstName: firstName?.trim() ?? subscriber.firstName,
        lastName: lastName?.trim() ?? subscriber.lastName,
        status: newStatus,
        source: newSource,
        tags: parsedTags,
      },
    });

    if (subscriber.status !== NewsletterSubscriberStatus.ACTIVE && newStatus === NewsletterSubscriberStatus.ACTIVE) {
      await prisma.newsletterConsentLog.create({
        data: {
          subscriberId: updated.id,
          action: NewsletterConsentAction.OPT_IN,
          meta: { source: newSource },
        },
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error("[newsletter] update subscriber error", error);
    return res.status(500).json({ message: "Impossible de mettre à jour l'abonné" });
  }
}

export async function unsubscribeSubscriber(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  try {
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id },
      data: { status: NewsletterSubscriberStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    });

    await prisma.newsletterConsentLog.create({
      data: {
        subscriberId: subscriber.id,
        action: NewsletterConsentAction.OPT_OUT,
        meta: { source: "admin" },
      },
    });

    return res.json(subscriber);
  } catch (error) {
    console.error("[newsletter] unsubscribe error", error);
    return res.status(500).json({ message: "Impossible de désinscrire l'abonné" });
  }
}

export async function resubscribeSubscriber(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  try {
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id },
      data: { status: NewsletterSubscriberStatus.ACTIVE, consentAt: new Date(), unsubscribedAt: null },
    });

    await prisma.newsletterConsentLog.create({
      data: {
        subscriberId: subscriber.id,
        action: NewsletterConsentAction.OPT_IN,
        meta: { source: "admin" },
      },
    });

    return res.json(subscriber);
  } catch (error) {
    console.error("[newsletter] resubscribe error", error);
    return res.status(500).json({ message: "Impossible de réactiver l'abonné" });
  }
}

export async function exportSubscriberData(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!subscriber) return res.status(404).json({ message: "Abonné introuvable" });
    const [consentLogs, preferenceLogs, sendLogs, activityEvents] = await Promise.all([
      prisma.newsletterConsentLog.findMany({ where: { subscriberId: id }, orderBy: { timestamp: "asc" } }),
      prisma.newsletterPreferenceLog.findMany({ where: { subscriberId: id }, orderBy: { changedAt: "asc" } }),
      prisma.newsletterSendLog.findMany({ where: { subscriberId: id } }),
      prisma.customerActivityEvent.findMany({ where: { email: subscriber.email } }),
    ]);

    await prisma.rGPDLog.create({
      data: { subscriberId: id, action: "EXPORT", performedByAdminId: (req as any).user?.id, meta: { exportedAt: new Date() } },
    });

    return res.json({ subscriber, consentLogs, preferenceLogs, sendLogs, activityEvents, exportedAt: new Date() });
  } catch (error) {
    console.error("[newsletter] export error", error);
    return res.status(500).json({ message: "Impossible d'exporter les données" });
  }
}

export async function anonymizeSubscriberData(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!subscriber) return res.status(404).json({ message: "Abonné introuvable" });
    const hashedEmail = crypto.createHash("sha256").update(subscriber.email).digest("hex");
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        email: `${hashedEmail}@anon.local`,
        firstName: null,
        lastName: null,
        status: NewsletterSubscriberStatus.ANONYMIZED,
        tags: [],
        preferencesJson: null,
        unsubscribedAt: new Date(),
      },
    });
    await prisma.customerActivityEvent.updateMany({ where: { email: subscriber.email }, data: { email: hashedEmail } });
    await prisma.newsletterSendLog.updateMany({ where: { subscriberId: id }, data: { email: `${hashedEmail}@anon.local` } });
    await prisma.rGPDLog.create({
      data: { subscriberId: id, action: "ANONYMIZE", performedByAdminId: (req as any).user?.id },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("[newsletter] anonymize error", error);
    return res.status(500).json({ message: "Impossible d'anonymiser" });
  }
}

export async function importSubscribers(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;
  const csvContent =
    file?.buffer?.toString("utf-8") || (req.body?.csv as string) || (req.body?.text as string) || "";

  if (!csvContent.trim()) {
    return res.status(400).json({ message: "Fichier CSV requis" });
  }

  try {
    const rows = parseCsv(csvContent);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const deduped = new Map<string, Record<string, string>>();
    rows.forEach((row) => {
      const email = (row.email || "").toLowerCase().trim();
      if (!isValidEmail(email)) return;
      deduped.set(email, row);
    });

    for (const [email, row] of deduped.entries()) {
      const subscriberStatus = normalizeStatus(row.status);
      const subscriberSource = normalizeSource(row.source || NewsletterSubscriberSource.ADMIN_IMPORT);
      const tags = sanitizeTags(row.tags);
      const firstName = row.firstName?.trim() || null;
      const lastName = row.lastName?.trim() || null;
      const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
      let proof: Prisma.InputJsonValue | undefined;

      if (row.consentProof) {
        try {
          proof = JSON.parse(row.consentProof) as Prisma.InputJsonValue;
        } catch {
          proof = undefined;
        }
      }

      if (!existing) {
        const createdSubscriber = await prisma.newsletterSubscriber.create({
          data: {
            email,
            firstName,
            lastName,
            status: subscriberStatus,
            source: subscriberSource,
            consentAt: new Date(),
            consentSource: row.consentSource?.trim() || "import",
            consentProof: proof || {},
            tags,
          },
        });

        if (subscriberStatus === NewsletterSubscriberStatus.ACTIVE) {
          await prisma.newsletterConsentLog.create({
            data: {
              subscriberId: createdSubscriber.id,
              action: NewsletterConsentAction.OPT_IN,
              meta: { source: subscriberSource },
            },
          });
        }

        created += 1;
      } else {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { firstName, lastName, status: subscriberStatus, source: subscriberSource, tags },
        });
        updated += 1;
      }
    }

    skipped = rows.length - deduped.size;

    return res.json({ created, updated, skipped, total: deduped.size });
  } catch (error) {
    console.error("[newsletter] import error", error);
    return res.status(500).json({ message: "Import CSV impossible" });
  }
}

export async function exportSubscribers(req: Request, res: Response) {
  try {
    const where = buildListWhere(req);
    const items = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const headers = ["email", "firstName", "lastName", "status", "source", "consentAt", "createdAt", "tags"];
    const lines = [headers.join(",")];

    items.forEach((item) => {
      const row = [
        item.email,
        item.firstName || "",
        item.lastName || "",
        item.status,
        item.source,
        item.consentAt.toISOString(),
        item.createdAt.toISOString(),
        item.tags.join(";"),
      ];
      lines.push(row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
    });

    const csvData = lines.join("\n");
    res.header("Content-Type", "text/csv");
    res.attachment("newsletter-subscribers.csv");
    return res.send(csvData);
  } catch (error) {
    console.error("[newsletter] export error", error);
    return res.status(500).json({ message: "Export impossible" });
  }
}

function resolvePeriodRange(period?: string | null, from?: string | null, to?: string | null) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  switch ((period || "30d").toLowerCase()) {
    case "7d": {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 6);
      return { from: start, to: new Date(today.getTime() + 86_399_000) };
    }
    case "mtd": {
      return { from: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)), to: today };
    }
    case "ytd": {
      return { from: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)), to: today };
    }
    case "30d":
    default: {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 29);
      return { from: start, to: today };
    }
  }
}

export async function getNewsletterKpis(req: Request, res: Response) {
  const { period, from, to } = req.query as { period?: string; from?: string; to?: string };
  try {
    const range = resolvePeriodRange(period, from, to);
    const fromDate = parseDateParam(from) || range.from;
    const toDate = parseDateParam(to) || range.to;

    const [activeCount, unsubscribedCount, periodGrowth] = await Promise.all([
      prisma.newsletterSubscriber.count({ where: { status: NewsletterSubscriberStatus.ACTIVE } }),
      prisma.newsletterSubscriber.count({ where: { status: NewsletterSubscriberStatus.UNSUBSCRIBED } }),
      prisma.newsletterSubscriber.count({
        where: {
          status: NewsletterSubscriberStatus.ACTIVE,
          createdAt: {
            gte: fromDate,
            lte: toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : undefined,
          },
        },
      }),
    ]);

    return res.json({
      activeCount,
      unsubscribedCount,
      newActiveInPeriod: periodGrowth,
      period: { from: fromDate, to: toDate },
    });
  } catch (error) {
    console.error("[newsletter] kpi error", error);
    return res.status(500).json({ message: "Impossible de charger les KPI" });
  }
}
