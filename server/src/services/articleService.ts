import { ArticleStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { normalizeUploadUrl } from "../utils/assetPaths";

function normalizeSlug(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return normalized || value.trim();
}

function sanitizeString(value?: string | null) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function sanitizeUpload(value?: string | null) {
  const normalized = normalizeUploadUrl(value ?? undefined);
  if (normalized) return normalized;
  return sanitizeString(value);
}

function sanitizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeReadTime(value: unknown) {
  if (value === null || typeof value === "undefined") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export interface ArticleFilters {
  status?: ArticleStatus;
  category?: string;
  search?: string;
  publishedOnly?: boolean;
}

export async function listArticles(filters: ArticleFilters = {}) {
  const { status, category, search, publishedOnly } = filters;

  const where: Prisma.ArticleWhereInput = {};

  if (publishedOnly) {
    where.status = ArticleStatus.PUBLISHED;
  } else if (status) {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { authorName: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.article.findMany({
    where,
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function getArticleById(id: string) {
  return prisma.article.findUnique({
    where: { id },
  });
}

export async function getPublishedArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED },
  });
}

export async function createArticle(data: Prisma.ArticleUncheckedCreateInput) {
  const payload: Prisma.ArticleUncheckedCreateInput = {
    title: data.title,
    slug: normalizeSlug(data.slug || data.title),
    authorName: sanitizeString(data.authorName),
    content: data.content,
    status: data.status ?? ArticleStatus.DRAFT,
    excerpt: sanitizeString(data.excerpt),
    coverImageUrl: sanitizeUpload(data.coverImageUrl),
    seoTitle: sanitizeString(data.seoTitle),
    seoDescription: sanitizeString(data.seoDescription),
    index: sanitizeBoolean((data as any).index, true),
    follow: sanitizeBoolean((data as any).follow, true),
    ogImageUrl: sanitizeUpload((data as any).ogImageUrl),
    category: sanitizeString(data.category),
    readTimeMinutes: normalizeReadTime(data.readTimeMinutes),
    publishedAt:
      data.status === ArticleStatus.PUBLISHED && !data.publishedAt
        ? new Date()
        : data.publishedAt ?? null,
  };

  return prisma.article.create({ data: payload });
}

export async function updateArticle(
  id: string,
  data: Prisma.ArticleUpdateInput & { status?: ArticleStatus }
) {
  const existing = await getArticleById(id);
  if (!existing) return null;

  const payload: Prisma.ArticleUpdateInput = {
    title: data.title ?? existing.title,
    slug: data.slug
      ? normalizeSlug(String(data.slug))
      : existing.slug,
    authorName:
      typeof data.authorName === "undefined"
        ? existing.authorName
        : sanitizeString(String(data.authorName)),
    content: data.content ?? existing.content,
    status: data.status ?? existing.status,
    excerpt:
      typeof data.excerpt === "undefined"
        ? existing.excerpt
        : sanitizeString(String(data.excerpt)),
    coverImageUrl:
      typeof data.coverImageUrl === "undefined"
        ? existing.coverImageUrl
        : sanitizeUpload(String(data.coverImageUrl)),
    seoTitle:
      typeof data.seoTitle === "undefined"
        ? existing.seoTitle
        : sanitizeString(String(data.seoTitle)),
    seoDescription:
      typeof data.seoDescription === "undefined"
        ? existing.seoDescription
        : sanitizeString(String(data.seoDescription)),
    index:
      typeof (data as any).index === "undefined"
        ? existing.index
        : sanitizeBoolean((data as any).index, existing.index),
    follow:
      typeof (data as any).follow === "undefined"
        ? existing.follow
        : sanitizeBoolean((data as any).follow, existing.follow),
    ogImageUrl:
      typeof (data as any).ogImageUrl === "undefined"
        ? existing.ogImageUrl
        : sanitizeUpload((data as any).ogImageUrl),
    category:
      typeof data.category === "undefined"
        ? existing.category
        : sanitizeString(String(data.category)),
    readTimeMinutes:
      typeof data.readTimeMinutes === "undefined"
        ? existing.readTimeMinutes
        : normalizeReadTime(data.readTimeMinutes),
    publishedAt:
      data.status === ArticleStatus.PUBLISHED && !existing.publishedAt
        ? new Date()
        : data.publishedAt ?? existing.publishedAt,
  };

  return prisma.article.update({
    where: { id },
    data: payload,
  });
}

export async function listRecentPublishedArticles(limit = 3, excludeId?: string) {
  return prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      NOT: excludeId ? { id: excludeId } : undefined,
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}
