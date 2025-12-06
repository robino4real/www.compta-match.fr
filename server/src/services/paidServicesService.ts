import { PaidServicePlan, PaidServiceType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

function sanitizeString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeInt(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function normalizeDecimal(value: unknown, fallback: Prisma.Decimal) {
  if (value instanceof Prisma.Decimal) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Prisma.Decimal(value);
  }
  if (typeof value === "string" && value.trim()) {
    const normalized = Number(value.replace(",", "."));
    if (!Number.isNaN(normalized)) {
      return new Prisma.Decimal(normalized);
    }
  }
  return fallback;
}

export function serializePlan(plan: PaidServicePlan) {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    subtitle: plan.subtitle,
    priceAmount: Number(plan.priceAmount),
    priceCurrency: plan.priceCurrency,
    pricePeriod: plan.pricePeriod,
    isHighlighted: plan.isHighlighted,
    isPublished: plan.isPublished,
    sortOrder: plan.sortOrder,
    stripePriceId: plan.stripePriceId,
    serviceType: plan.serviceType,
  };
}

export async function listPublishedPlans(serviceType: PaidServiceType = "COMPTAPRO") {
  const plans = await prisma.paidServicePlan.findMany({
    where: { isPublished: true, serviceType },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map(serializePlan);
}

export async function listAllPlans(serviceType: PaidServiceType = "COMPTAPRO") {
  const plans = await prisma.paidServicePlan.findMany({
    where: { serviceType },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map(serializePlan);
}

export async function createPlan(data: {
  name: string;
  slug: string;
  subtitle?: string | null;
  priceAmount: Prisma.Decimal | number | string;
  priceCurrency: string;
  pricePeriod: string;
  isHighlighted?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  stripePriceId?: string | null;
  serviceType?: PaidServiceType;
}) {
  const payload = {
    name: data.name.trim(),
    slug: data.slug.trim(),
    subtitle: sanitizeString(data.subtitle),
    priceAmount: normalizeDecimal(data.priceAmount, new Prisma.Decimal(0)),
    priceCurrency: data.priceCurrency.trim(),
    pricePeriod: data.pricePeriod.trim(),
    isHighlighted: normalizeBoolean(data.isHighlighted, false),
    isPublished: normalizeBoolean(data.isPublished, false),
    sortOrder: normalizeInt(data.sortOrder, 0),
    stripePriceId: sanitizeString(data.stripePriceId),
    serviceType: data.serviceType || PaidServiceType.COMPTAPRO,
  };

  const created = await prisma.paidServicePlan.create({ data: payload });
  return serializePlan(created);
}

export async function updatePlan(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    subtitle: string | null;
    priceAmount: Prisma.Decimal | number | string;
    priceCurrency: string;
    pricePeriod: string;
    isHighlighted: boolean;
    isPublished: boolean;
    sortOrder: number;
    stripePriceId: string | null;
    serviceType: PaidServiceType;
  }>
) {
  const existing = await prisma.paidServicePlan.findUnique({ where: { id } });
  if (!existing) return null;

  const payload: Prisma.PaidServicePlanUpdateInput = {
    name: data.name?.trim?.() || existing.name,
    slug: data.slug?.trim?.() || existing.slug,
    subtitle:
      typeof data.subtitle === "undefined"
        ? existing.subtitle
        : sanitizeString(data.subtitle),
    priceAmount:
      typeof data.priceAmount === "undefined"
        ? existing.priceAmount
        : normalizeDecimal(data.priceAmount, existing.priceAmount),
    priceCurrency: data.priceCurrency?.trim?.() || existing.priceCurrency,
    pricePeriod: data.pricePeriod?.trim?.() || existing.pricePeriod,
    isHighlighted:
      typeof data.isHighlighted === "undefined"
        ? existing.isHighlighted
        : normalizeBoolean(data.isHighlighted, existing.isHighlighted),
    isPublished:
      typeof data.isPublished === "undefined"
        ? existing.isPublished
        : normalizeBoolean(data.isPublished, existing.isPublished),
    sortOrder:
      typeof data.sortOrder === "undefined"
        ? existing.sortOrder
        : normalizeInt(data.sortOrder, existing.sortOrder),
    stripePriceId:
      typeof data.stripePriceId === "undefined"
        ? existing.stripePriceId
        : sanitizeString(data.stripePriceId),
    serviceType: data.serviceType || existing.serviceType,
  };

  const updated = await prisma.paidServicePlan.update({
    where: { id },
    data: payload,
  });
  return serializePlan(updated);
}

export async function deletePlan(id: string) {
  await prisma.paidServicePlan.delete({ where: { id } });
}

export async function listFeatureRows(serviceType: PaidServiceType = "COMPTAPRO") {
  return prisma.paidServiceFeatureRow.findMany({
    where: { serviceType },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createFeatureRow(data: {
  label: string;
  description?: string | null;
  planAId?: string | null;
  planBId?: string | null;
  planAIncluded?: boolean;
  planBIncluded?: boolean;
  sortOrder?: number;
  serviceType?: PaidServiceType;
}) {
  return prisma.paidServiceFeatureRow.create({
    data: {
      label: data.label.trim(),
      description: sanitizeString(data.description),
      planAId: data.planAId || null,
      planBId: data.planBId || null,
      planAIncluded: normalizeBoolean(data.planAIncluded, false),
      planBIncluded: normalizeBoolean(data.planBIncluded, false),
      sortOrder: normalizeInt(data.sortOrder, 0),
      serviceType: data.serviceType || PaidServiceType.COMPTAPRO,
    },
  });
}

export async function updateFeatureRow(
  id: string,
  data: Partial<{
    label: string;
    description: string | null;
    planAId: string | null;
    planBId: string | null;
    planAIncluded: boolean;
    planBIncluded: boolean;
    sortOrder: number;
    serviceType: PaidServiceType;
  }>
) {
  const existing = await prisma.paidServiceFeatureRow.findUnique({ where: { id } });
  if (!existing) return null;

  return prisma.paidServiceFeatureRow.update({
    where: { id },
    data: {
      label: data.label?.trim?.() || existing.label,
      description:
        typeof data.description === "undefined"
          ? existing.description
          : sanitizeString(data.description),
      planAId: typeof data.planAId === "undefined" ? existing.planAId : data.planAId,
      planBId: typeof data.planBId === "undefined" ? existing.planBId : data.planBId,
      planAIncluded:
        typeof data.planAIncluded === "undefined"
          ? existing.planAIncluded
          : normalizeBoolean(data.planAIncluded, existing.planAIncluded),
      planBIncluded:
        typeof data.planBIncluded === "undefined"
          ? existing.planBIncluded
          : normalizeBoolean(data.planBIncluded, existing.planBIncluded),
      sortOrder:
        typeof data.sortOrder === "undefined"
          ? existing.sortOrder
          : normalizeInt(data.sortOrder, existing.sortOrder),
      serviceType: data.serviceType || existing.serviceType,
    },
  });
}

export async function deleteFeatureRow(id: string) {
  await prisma.paidServiceFeatureRow.delete({ where: { id } });
}

export async function listPublishedSections(serviceType: PaidServiceType = "COMPTAPRO") {
  return prisma.paidServiceSection.findMany({
    where: { isPublished: true, serviceType },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAllSections(serviceType: PaidServiceType = "COMPTAPRO") {
  return prisma.paidServiceSection.findMany({
    where: { serviceType },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createSection(data: {
  title: string;
  body: string;
  imageUrl?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
  serviceType?: PaidServiceType;
}) {
  return prisma.paidServiceSection.create({
    data: {
      title: data.title.trim(),
      body: data.body,
      imageUrl: sanitizeString(data.imageUrl),
      sortOrder: normalizeInt(data.sortOrder, 0),
      isPublished: normalizeBoolean(data.isPublished, true),
      serviceType: data.serviceType || PaidServiceType.COMPTAPRO,
    },
  });
}

export async function updateSection(
  id: string,
  data: Partial<{ title: string; body: string; imageUrl: string | null; sortOrder: number; isPublished: boolean; serviceType: PaidServiceType }>
) {
  const existing = await prisma.paidServiceSection.findUnique({ where: { id } });
  if (!existing) return null;

  return prisma.paidServiceSection.update({
    where: { id },
    data: {
      title: data.title?.trim?.() || existing.title,
      body: typeof data.body === "undefined" ? existing.body : data.body,
      imageUrl:
        typeof data.imageUrl === "undefined"
          ? existing.imageUrl
          : sanitizeString(data.imageUrl),
      sortOrder:
        typeof data.sortOrder === "undefined"
          ? existing.sortOrder
          : normalizeInt(data.sortOrder, existing.sortOrder),
      isPublished:
        typeof data.isPublished === "undefined"
          ? existing.isPublished
          : normalizeBoolean(data.isPublished, existing.isPublished),
      serviceType: data.serviceType || existing.serviceType,
    },
  });
}

export async function deleteSection(id: string) {
  await prisma.paidServiceSection.delete({ where: { id } });
}
