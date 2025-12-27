import { BrandTone, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { assertTablesExist } from "../utils/dbReadiness";
import { HttpError } from "../utils/errors";

type DiagnosticLevel = "ok" | "warning" | "error";

export type DiagnosticAction = {
  label: string;
  href?: string;
};

export type DiagnosticCheck = {
  id: string;
  category: string;
  level: DiagnosticLevel;
  title: string;
  message: string;
  action?: DiagnosticAction;
  meta?: Record<string, unknown>;
};

export type DiagnosticsResult = {
  generatedAt: string;
  summary: {
    errors: number;
    warnings: number;
    ok: number;
  };
  checks: DiagnosticCheck[];
};

export class ValidationError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const SEO_SINGLETON_KEY = "global";
const GEO_SINGLETON_KEY = "global";
const SEO_GEO_TABLES = [
  "SeoSettingsV2",
  "PageSeo",
  "ProductSeo",
  "GeoIdentity",
  "GeoFaqItem",
  "GeoAnswer",
];

let lastSeoGeoCheckAt = 0;
const SEO_GEO_CHECK_TTL = 60_000;

async function ensureSeoGeoTables() {
  const now = Date.now();
  if (now - lastSeoGeoCheckAt < SEO_GEO_CHECK_TTL) return;

  await assertTablesExist(SEO_GEO_TABLES, "seo-geo");
  lastSeoGeoCheckAt = now;
}

function normalizeString(value: unknown, maxLength?: number): string | null | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const safeValue = maxLength ? trimmed.slice(0, maxLength) : trimmed;
    return safeValue;
  }
  if (value === null) return null;
  return undefined;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return undefined;
}

function parseBrandTone(value: unknown): BrandTone | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new ValidationError("Valeur de ton de marque invalide");
  }
  const normalized = value.trim().toUpperCase();
  if ((Object.values(BrandTone) as string[]).includes(normalized)) {
    return normalized as BrandTone;
  }
  throw new ValidationError("Ton de marque non reconnu");
}

function mapNotFound(error: unknown, message: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    throw new ValidationError(message, 404, "NOT_FOUND");
  }
}

export async function getSeoSettingsSingleton() {
  await ensureSeoGeoTables();
  return prisma.seoSettingsV2.upsert({
    where: { singletonKey: SEO_SINGLETON_KEY },
    update: {},
    create: { singletonKey: SEO_SINGLETON_KEY },
  });
}

export async function updateSeoSettingsSingleton(payload: Record<string, unknown>) {
  await ensureSeoGeoTables();
  const data: Prisma.SeoSettingsV2UpdateInput = {};

  const siteName = normalizeString(payload.siteName, 180);
  if (siteName !== undefined) data.siteName = siteName;
  const defaultTitle = normalizeString(payload.defaultTitle, 180);
  if (defaultTitle !== undefined) data.defaultTitle = defaultTitle;
  const defaultDescription = normalizeString(payload.defaultDescription, 320);
  if (defaultDescription !== undefined) data.defaultDescription = defaultDescription;
  const defaultOgImageUrl = normalizeString(payload.defaultOgImageUrl, 500);
  if (defaultOgImageUrl !== undefined) data.defaultOgImageUrl = defaultOgImageUrl;
  const canonicalBaseUrl = normalizeString(payload.canonicalBaseUrl, 500);
  if (canonicalBaseUrl !== undefined) data.canonicalBaseUrl = canonicalBaseUrl;
  const robotsTxt = normalizeString(payload.robotsTxt, 5000);
  if (robotsTxt !== undefined) data.robotsTxt = robotsTxt;

  const defaultRobotsIndex = normalizeBoolean(payload.defaultRobotsIndex);
  if (defaultRobotsIndex !== undefined) data.defaultRobotsIndex = defaultRobotsIndex;
  const defaultRobotsFollow = normalizeBoolean(payload.defaultRobotsFollow);
  if (defaultRobotsFollow !== undefined) data.defaultRobotsFollow = defaultRobotsFollow;
  const sitemapEnabled = normalizeBoolean(payload.sitemapEnabled);
  if (sitemapEnabled !== undefined) data.sitemapEnabled = sitemapEnabled;
  const sitemapIncludePages = normalizeBoolean(payload.sitemapIncludePages);
  if (sitemapIncludePages !== undefined) data.sitemapIncludePages = sitemapIncludePages;
  const sitemapIncludeProducts = normalizeBoolean(payload.sitemapIncludeProducts);
  if (sitemapIncludeProducts !== undefined) data.sitemapIncludeProducts = sitemapIncludeProducts;
  const sitemapIncludeArticles = normalizeBoolean(payload.sitemapIncludeArticles);
  if (sitemapIncludeArticles !== undefined) data.sitemapIncludeArticles = sitemapIncludeArticles;

  return prisma.seoSettingsV2.upsert({
    where: { singletonKey: SEO_SINGLETON_KEY },
    update: data,
    create: {
      singletonKey: SEO_SINGLETON_KEY,
      ...(data as Prisma.SeoSettingsV2CreateInput),
    },
  });
}

export async function getGeoIdentitySingleton() {
  await ensureSeoGeoTables();
  return prisma.geoIdentity.upsert({
    where: { singletonKey: GEO_SINGLETON_KEY },
    update: {},
    create: { singletonKey: GEO_SINGLETON_KEY },
  });
}

export async function updateGeoIdentitySingleton(payload: Record<string, unknown>) {
  await ensureSeoGeoTables();
  const data: Prisma.GeoIdentityUpdateInput = {};

  const shortDescription = normalizeString(payload.shortDescription, 260);
  if (shortDescription !== undefined) data.shortDescription = shortDescription;
  const longDescription = normalizeString(payload.longDescription, 2000);
  if (longDescription !== undefined) data.longDescription = longDescription;
  const targetAudience = normalizeString(payload.targetAudience, 255);
  if (targetAudience !== undefined) data.targetAudience = targetAudience;
  const positioning = normalizeString(payload.positioning, 255);
  if (positioning !== undefined) data.positioning = positioning;
  const differentiation = normalizeString(payload.differentiation, 2000);
  if (differentiation !== undefined) data.differentiation = differentiation;
  const language = normalizeString(payload.language, 10);
  if (language !== undefined) data.language = language;

  const brandTone = parseBrandTone(payload.brandTone);
  if (brandTone !== undefined) data.brandTone = brandTone;

  return prisma.geoIdentity.upsert({
    where: { singletonKey: GEO_SINGLETON_KEY },
    update: data,
    create: {
      singletonKey: GEO_SINGLETON_KEY,
      ...(data as Prisma.GeoIdentityCreateInput),
    },
  });
}

export async function listGeoFaqItems() {
  await ensureSeoGeoTables();
  return prisma.geoFaqItem.findMany({
    orderBy: [
      { order: "asc" },
      { createdAt: "asc" },
    ],
  });
}

export async function createGeoFaqItem(payload: Record<string, unknown>) {
  await ensureSeoGeoTables();
  const question = normalizeString(payload.question, 500);
  const answer = normalizeString(payload.answer, 5000);

  if (!question || !answer) {
    throw new ValidationError("Question et réponse sont obligatoires");
  }

  const currentMax = await prisma.geoFaqItem.aggregate({ _max: { order: true } });
  const nextOrder = (currentMax._max.order ?? -1) + 1;

  return prisma.geoFaqItem.create({
    data: {
      question,
      answer,
      order: nextOrder,
    },
  });
}

export async function updateGeoFaqItem(id: string, payload: Record<string, unknown>) {
  await ensureSeoGeoTables();
  const question = normalizeString(payload.question, 500);
  const answer = normalizeString(payload.answer, 5000);

  const data: Prisma.GeoFaqItemUpdateInput = {};
  if (question !== undefined) {
    if (question === null || question.length === 0) throw new ValidationError("La question est requise");
    data.question = question;
  }
  if (answer !== undefined) {
    if (answer === null || answer.length === 0) throw new ValidationError("La réponse est requise");
    data.answer = answer;
  }

  try {
    return await prisma.geoFaqItem.update({
      where: { id },
      data,
    });
  } catch (error) {
    mapNotFound(error, "Élément de FAQ introuvable");
    throw error;
  }
}

export async function deleteGeoFaqItem(id: string) {
  await ensureSeoGeoTables();
  try {
    await prisma.geoFaqItem.delete({ where: { id } });
  } catch (error) {
    mapNotFound(error, "Élément de FAQ introuvable");
    throw error;
  }
}

export async function reorderGeoFaqItems(ids: string[]) {
  await ensureSeoGeoTables();
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("Liste d'IDs requise pour le réordonnancement");
  }

  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length !== ids.length) {
    throw new ValidationError("Des IDs en doublon ont été fournis");
  }

  const existing = await prisma.geoFaqItem.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  if (existing.length !== ids.length) {
    throw new ValidationError("Certains éléments fournis n'existent pas", 400, "NOT_FOUND");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.geoFaqItem.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return listGeoFaqItems();
}

export async function listGeoAnswers() {
  await ensureSeoGeoTables();
  return prisma.geoAnswer.findMany({
    orderBy: [
      { order: "asc" },
      { createdAt: "asc" },
    ],
  });
}

export async function createGeoAnswer(payload: Record<string, unknown>) {
  await ensureSeoGeoTables();
  const question = normalizeString(payload.question, 500);
  if (!question) {
    throw new ValidationError("La question est obligatoire");
  }

  const shortAnswer = normalizeString(payload.shortAnswer, 1000);
  const longAnswer = normalizeString(payload.longAnswer, 5000);

  const currentMax = await prisma.geoAnswer.aggregate({ _max: { order: true } });
  const nextOrder = (currentMax._max.order ?? -1) + 1;

  return prisma.geoAnswer.create({
    data: {
      question,
      shortAnswer: shortAnswer ?? null,
      longAnswer: longAnswer ?? null,
      order: nextOrder,
    },
  });
}

export async function updateGeoAnswer(id: string, payload: Record<string, unknown>) {
  await ensureSeoGeoTables();
  const question = normalizeString(payload.question, 500);
  const shortAnswer = normalizeString(payload.shortAnswer, 1000);
  const longAnswer = normalizeString(payload.longAnswer, 5000);

  const data: Prisma.GeoAnswerUpdateInput = {};

  if (question !== undefined) {
    if (question === null || question.length === 0) throw new ValidationError("La question est requise");
    data.question = question;
  }

  if (shortAnswer !== undefined) data.shortAnswer = shortAnswer;
  if (longAnswer !== undefined) data.longAnswer = longAnswer;

  try {
    return await prisma.geoAnswer.update({ where: { id }, data });
  } catch (error) {
    mapNotFound(error, "Réponse introuvable");
    throw error;
  }
}

export async function deleteGeoAnswer(id: string) {
  await ensureSeoGeoTables();
  try {
    await prisma.geoAnswer.delete({ where: { id } });
  } catch (error) {
    mapNotFound(error, "Réponse introuvable");
    throw error;
  }
}

export async function reorderGeoAnswers(ids: string[]) {
  await ensureSeoGeoTables();
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("Liste d'IDs requise pour le réordonnancement");
  }

  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length !== ids.length) {
    throw new ValidationError("Des IDs en doublon ont été fournis");
  }

  const existing = await prisma.geoAnswer.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (existing.length !== ids.length) {
    throw new ValidationError("Certains éléments fournis n'existent pas", 400, "NOT_FOUND");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.geoAnswer.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return listGeoAnswers();
}

function ensureId(id: string | undefined, label: string) {
  if (!id || id.trim().length === 0) {
    throw new ValidationError(`${label} manquant`, 400, "INVALID_ID");
  }
  return id.trim();
}

export async function getPageSeoByPageId(pageId: string) {
  const validId = ensureId(pageId, "pageId");
  return prisma.pageSeo.findUnique({ where: { pageId: validId } });
}

export async function savePageSeo(pageId: string, payload: Record<string, unknown>) {
  const validId = ensureId(pageId, "pageId");
  const pageExists = await prisma.customPage.findUnique({ where: { id: validId } });
  if (!pageExists) {
    throw new ValidationError("Page introuvable", 404, "NOT_FOUND");
  }

  const data: Prisma.PageSeoUpdateInput = {};
  const title = normalizeString(payload.title, 180);
  if (title !== undefined) data.title = title;
  const description = normalizeString(payload.description, 320);
  if (description !== undefined) data.description = description;
  const ogImageUrl = normalizeString(payload.ogImageUrl, 500);
  if (ogImageUrl !== undefined) data.ogImageUrl = ogImageUrl;
  const canonicalUrl = normalizeString(payload.canonicalUrl, 500);
  if (canonicalUrl !== undefined) data.canonicalUrl = canonicalUrl;
  const robotsIndex = normalizeBoolean(payload.robotsIndex);
  if (robotsIndex !== undefined) data.robotsIndex = robotsIndex;
  const robotsFollow = normalizeBoolean(payload.robotsFollow);
  if (robotsFollow !== undefined) data.robotsFollow = robotsFollow;

  return prisma.pageSeo.upsert({
    where: { pageId: validId },
    update: data,
    create: {
      ...(data as Prisma.PageSeoUncheckedCreateInput),
      pageId: validId,
    },
  });
}

export async function getProductSeoByProductId(productId: string) {
  const validId = ensureId(productId, "productId");
  return prisma.productSeo.findUnique({ where: { productId: validId } });
}

export async function saveProductSeo(productId: string, payload: Record<string, unknown>) {
  const validId = ensureId(productId, "productId");
  const productExists = await prisma.downloadableProduct.findUnique({ where: { id: validId } });
  if (!productExists) {
    throw new ValidationError("Produit introuvable", 404, "NOT_FOUND");
  }

  const data: Prisma.ProductSeoUpdateInput = {};
  const title = normalizeString(payload.title, 180);
  if (title !== undefined) data.title = title;
  const description = normalizeString(payload.description, 320);
  if (description !== undefined) data.description = description;
  const ogImageUrl = normalizeString(payload.ogImageUrl, 500);
  if (ogImageUrl !== undefined) data.ogImageUrl = ogImageUrl;
  const canonicalUrl = normalizeString(payload.canonicalUrl, 500);
  if (canonicalUrl !== undefined) data.canonicalUrl = canonicalUrl;
  const robotsIndex = normalizeBoolean(payload.robotsIndex);
  if (robotsIndex !== undefined) data.robotsIndex = robotsIndex;
  const robotsFollow = normalizeBoolean(payload.robotsFollow);
  if (robotsFollow !== undefined) data.robotsFollow = robotsFollow;

  return prisma.productSeo.upsert({
    where: { productId: validId },
    update: data,
    create: {
      ...(data as Prisma.ProductSeoUncheckedCreateInput),
      productId: validId,
    },
  });
}

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

const DIAGNOSTICS_CACHE_TTL_MS = 30 * 1000;
let diagnosticsCache: { expiresAt: number; result: DiagnosticsResult } | null = null;

function normalizeBaseUrl(baseUrl?: string | null) {
  const fallback = "https://www.compta-match.fr";
  if (!baseUrl) return fallback;
  return baseUrl.replace(/\/$/, "") || fallback;
}

function buildSitemapEntries(
  settings: Prisma.SeoSettingsV2GetPayload<{}>,
  options: {
    pages: { route: string; updatedAt: Date }[];
    products: { slug: string; updatedAt: Date }[];
    articles: { slug: string; updatedAt: Date }[];
    homepageUpdatedAt?: Date | null;
  }
) {
  const baseUrl = normalizeBaseUrl(settings.canonicalBaseUrl);
  const entries: SitemapEntry[] = [];

  entries.push({
    loc: `${baseUrl}/`,
    lastmod: options.homepageUpdatedAt?.toISOString(),
    changefreq: "weekly",
    priority: "1.0",
  });

  if (settings.sitemapEnabled && settings.sitemapIncludePages) {
    options.pages.forEach((page) => {
      const route = page.route.startsWith("/") ? page.route : `/${page.route}`;
      entries.push({
        loc: `${baseUrl}${route}`,
        lastmod: page.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: "0.7",
      });
    });
  }

  if (settings.sitemapEnabled && settings.sitemapIncludeArticles) {
    entries.push({ loc: `${baseUrl}/articles`, changefreq: "weekly", priority: "0.7" });
    options.articles.forEach((article) => {
      entries.push({
        loc: `${baseUrl}/articles/${article.slug}`,
        lastmod: article.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: "0.7",
      });
    });
  }

  if (settings.sitemapEnabled && settings.sitemapIncludeProducts) {
    options.products.forEach((product) => {
      entries.push({
        loc: `${baseUrl}/telechargements/${product.slug}`,
        lastmod: product.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: "0.7",
      });
    });
  }

  return entries;
}

function buildSitemapXml(entries: SitemapEntry[]) {
  const xmlItems = entries
    .map((url) => {
      const lastmod = url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : "";
      const changefreq = url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : "";
      const priority = url.priority ? `<priority>${url.priority}</priority>` : "";
      return `<url><loc>${url.loc}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xmlItems}</urlset>`;
}

function pushCheck(list: DiagnosticCheck[], check: Omit<DiagnosticCheck, "id"> & { id?: string }) {
  const generatedId = check.id || `${check.category}-${list.length + 1}`;
  list.push({ ...check, id: generatedId });
}

function summarizeChecks(checks: DiagnosticCheck[]) {
  return checks.reduce(
    (acc, item) => {
      if (item.level === "error") acc.errors += 1;
      else if (item.level === "warning") acc.warnings += 1;
      else acc.ok += 1;
      return acc;
    },
    { errors: 0, warnings: 0, ok: 0 }
  );
}

function containsRobotsBlock(content: string | null | undefined) {
  if (!content) return false;
  const lower = content.toLowerCase();
  return lower.includes("disallow: /") || lower.includes("noindex");
}

export async function runSeoGeoDiagnostics(): Promise<DiagnosticsResult> {
  const now = Date.now();
  if (diagnosticsCache && diagnosticsCache.expiresAt > now) {
    return diagnosticsCache.result;
  }

  const [
    settings,
    geoIdentity,
    faqItems,
    answers,
    homepageSettings,
    pages,
    products,
    articles,
    pageSeoCanonical,
    productSeoCanonical,
  ] = await Promise.all([
    getSeoSettingsSingleton(),
    getGeoIdentitySingleton(),
    prisma.geoFaqItem.findMany({ select: { id: true } }),
    prisma.geoAnswer.findMany({ select: { id: true } }),
    prisma.homepageSettings.findFirst().catch(() => null),
    prisma.customPage.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, route: true, updatedAt: true, seo: true },
    }),
    prisma.downloadableProduct.findMany({
      where: { isActive: true, isArchived: false },
      select: {
        id: true,
        name: true,
        slug: true,
        seoTitle: true,
        seoDescription: true,
        longDescription: true,
        shortDescription: true,
        index: true,
        follow: true,
        updatedAt: true,
        seoOverride: true,
      },
    }),
    prisma.article.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.pageSeo.findMany({ where: { canonicalUrl: { not: null } }, select: { canonicalUrl: true } }),
    prisma.productSeo.findMany({ where: { canonicalUrl: { not: null } }, select: { canonicalUrl: true } }),
  ]);

  const checks: DiagnosticCheck[] = [];

  // Indexation blockers
  if (containsRobotsBlock(settings.robotsTxt)) {
    pushCheck(checks, {
      id: "robots-blocking",
      category: "Indexation",
      level: "error",
      title: "robots.txt bloque l'indexation",
      message: "Le robots.txt contient une directive Disallow ou noindex globale.",
      action: { label: "Ouvrir SEO", href: "/admin/seo-geo?tab=seo" },
    });
  } else {
    pushCheck(checks, {
      id: "robots-ok",
      category: "Indexation",
      level: "ok",
      title: "robots.txt",
      message: "Aucun blocage détecté dans le robots.txt.",
    });
  }

  if (settings.defaultRobotsIndex === false) {
    pushCheck(checks, {
      id: "global-noindex",
      category: "Indexation",
      level: "error",
      title: "Noindex global activé",
      message: "La configuration globale désactive l'indexation.",
      action: { label: "Désactiver", href: "/admin/seo-geo?tab=seo" },
    });
  }

  if (settings.defaultRobotsFollow === false) {
    pushCheck(checks, {
      id: "global-nofollow",
      category: "Indexation",
      level: "warning",
      title: "Nofollow global activé",
      message: "Les liens sont marqués en nofollow par défaut.",
      action: { label: "Ajuster", href: "/admin/seo-geo?tab=seo" },
    });
  }

  // Sitemap
  const sitemapEntries = buildSitemapEntries(settings, {
    pages,
    products,
    articles,
    homepageUpdatedAt: homepageSettings?.updatedAt ?? null,
  });

  if (!settings.sitemapEnabled) {
    pushCheck(checks, {
      id: "sitemap-disabled",
      category: "Sitemap",
      level: "warning",
      title: "Sitemap désactivé",
      message: "Activez la génération du sitemap pour faciliter le crawl.",
      action: { label: "Activer", href: "/admin/seo-geo?tab=seo" },
      meta: { urlCount: sitemapEntries.length },
    });
  } else {
    pushCheck(checks, {
      id: "sitemap-enabled",
      category: "Sitemap",
      level: sitemapEntries.length <= 1 ? "warning" : "ok",
      title: "Sitemap",
      message:
        sitemapEntries.length <= 1
          ? "Le sitemap contient uniquement la page d'accueil. Ajoutez des pages/produits publiés."
          : `Le sitemap contient ${sitemapEntries.length} URLs.`,
      meta: { urlCount: sitemapEntries.length, xmlPreview: buildSitemapXml(sitemapEntries).slice(0, 2000) },
      action: { label: "Voir", href: "/admin/seo-geo?tab=seo" },
    });
  }

  // Metadata quality - pages
  const pagesMissingTitle = pages.filter((page) => !page.seo?.title && !settings.defaultTitle);
  if (pagesMissingTitle.length) {
    pushCheck(checks, {
      id: "pages-title-missing",
      category: "Méta",
      level: "warning",
      title: "Titres de pages manquants",
      message: `${pagesMissingTitle.length} page(s) n'ont pas de titre SEO et aucun titre par défaut n'est défini.`,
      meta: { routes: pagesMissingTitle.slice(0, 5).map((p) => p.route) },
      action: { label: "Compléter", href: "/admin/seo-geo?tab=seo" },
    });
  } else {
    pushCheck(checks, {
      id: "pages-title-ok",
      category: "Méta",
      level: "ok",
      title: "Titres de pages",
      message: "Les titres de pages disposent d'un fallback.",
    });
  }

  const pagesMissingDescription = pages.filter((page) => !page.seo?.description && !settings.defaultDescription);
  if (pagesMissingDescription.length) {
    pushCheck(checks, {
      id: "pages-description-missing",
      category: "Méta",
      level: "warning",
      title: "Descriptions de pages manquantes",
      message: `${pagesMissingDescription.length} page(s) sans description SEO et aucun défaut global.`,
      meta: { routes: pagesMissingDescription.slice(0, 5).map((p) => p.route) },
      action: { label: "Compléter", href: "/admin/seo-geo?tab=seo" },
    });
  } else {
    pushCheck(checks, {
      id: "pages-description-ok",
      category: "Méta",
      level: "ok",
      title: "Descriptions de pages",
      message: "Descriptions disponibles ou fallback global présent.",
    });
  }

  // Metadata quality - products
  const productsMissingTitle = products.filter(
    (product) => !product.seoOverride?.title && !product.seoTitle && !settings.defaultTitle
  );
  if (productsMissingTitle.length) {
    pushCheck(checks, {
      id: "products-title-missing",
      category: "Méta",
      level: "warning",
      title: "Titres produit manquants",
      message: `${productsMissingTitle.length} produit(s) sans titre SEO dédié et aucun titre global.`,
      meta: { slugs: productsMissingTitle.slice(0, 5).map((p) => p.slug) },
      action: { label: "Mettre à jour", href: "/admin/downloads" },
    });
  } else {
    pushCheck(checks, {
      id: "products-title-ok",
      category: "Méta",
      level: "ok",
      title: "Titres produit",
      message: "Les produits disposent d'un titre ou d'un fallback.",
    });
  }

  const productsMissingDescription = products.filter((product) => {
    const hasSeoDescription = Boolean(product.seoOverride?.description || product.seoDescription);
    const hasContentDescription = Boolean(product.longDescription || product.shortDescription);
    return !hasSeoDescription && !hasContentDescription && !settings.defaultDescription;
  });

  if (productsMissingDescription.length) {
    pushCheck(checks, {
      id: "products-description-missing",
      category: "Méta",
      level: "warning",
      title: "Descriptions produit manquantes",
      message: `${productsMissingDescription.length} produit(s) sans description SEO ni contenu, et aucun défaut global.`,
      meta: { slugs: productsMissingDescription.slice(0, 5).map((p) => p.slug) },
      action: { label: "Mettre à jour", href: "/admin/downloads" },
    });
  } else {
    pushCheck(checks, {
      id: "products-description-ok",
      category: "Méta",
      level: "ok",
      title: "Descriptions produit",
      message: "Descriptions disponibles ou fallback global présent.",
    });
  }

  // Duplicates
  const routeCounts: Record<string, number> = {};
  pages.forEach((page) => {
    const key = page.route.trim();
    routeCounts[key] = (routeCounts[key] || 0) + 1;
  });
  const duplicateRoutes = Object.entries(routeCounts)
    .filter(([, count]) => count > 1)
    .map(([route]) => route);
  if (duplicateRoutes.length) {
    pushCheck(checks, {
      id: "duplicate-routes",
      category: "Doublons",
      level: "warning",
      title: "Routes de pages en doublon",
      message: `Certaines routes sont en doublon: ${duplicateRoutes.join(", ")}.`,
      action: { label: "Vérifier", href: "/admin/pages" },
    });
  } else {
    pushCheck(checks, {
      id: "routes-unique",
      category: "Doublons",
      level: "ok",
      title: "Routes uniques",
      message: "Aucun doublon de route détecté.",
    });
  }

  const canonicalValues = [...pageSeoCanonical, ...productSeoCanonical]
    .map((item) => item.canonicalUrl?.trim())
    .filter((value): value is string => Boolean(value));
  const canonicalCounts: Record<string, number> = {};
  canonicalValues.forEach((value) => {
    canonicalCounts[value] = (canonicalCounts[value] || 0) + 1;
  });
  const duplicateCanonicals = Object.entries(canonicalCounts)
    .filter(([, count]) => count > 1)
    .map(([url]) => url);
  if (duplicateCanonicals.length) {
    pushCheck(checks, {
      id: "canonical-duplicates",
      category: "Doublons",
      level: "warning",
      title: "Canonical en doublon",
      message: `Plusieurs contenus partagent la même URL canonique: ${duplicateCanonicals.join(", ")}.`,
      action: { label: "Nettoyer", href: "/admin/seo-geo?tab=seo" },
      meta: { duplicates: duplicateCanonicals },
    });
  } else {
    pushCheck(checks, {
      id: "canonical-unique",
      category: "Doublons",
      level: "ok",
      title: "Canonicals uniques",
      message: "Aucun doublon d'URL canonique détecté.",
    });
  }

  // GEO readiness
  if (!geoIdentity.shortDescription || !geoIdentity.longDescription) {
    pushCheck(checks, {
      id: "geo-identity-missing",
      category: "GEO",
      level: "warning",
      title: "Identité IA incomplète",
      message: "Ajoutez une description courte et longue pour l'IA.",
      action: { label: "Compléter", href: "/admin/seo-geo?tab=geo" },
    });
  } else {
    pushCheck(checks, {
      id: "geo-identity-ok",
      category: "GEO",
      level: "ok",
      title: "Identité IA",
      message: "Descriptions IA présentes.",
    });
  }

  if (faqItems.length === 0) {
    pushCheck(checks, {
      id: "geo-faq-empty",
      category: "GEO",
      level: "warning",
      title: "FAQ IA vide",
      message: "Ajoutez des questions/réponses pour enrichir l'IA et la FAQ.",
      action: { label: "Ajouter", href: "/admin/seo-geo?tab=geo" },
    });
  } else {
    pushCheck(checks, {
      id: "geo-faq-ok",
      category: "GEO",
      level: "ok",
      title: "FAQ IA",
      message: `${faqItems.length} élément(s) présents.`,
    });
  }

  if (answers.length === 0) {
    pushCheck(checks, {
      id: "geo-answers-empty",
      category: "GEO",
      level: "warning",
      title: "Réponses IA vides",
      message: "Ajoutez des réponses IA globales pour nourrir le modèle.",
      action: { label: "Ajouter", href: "/admin/seo-geo?tab=geo" },
    });
  } else {
    pushCheck(checks, {
      id: "geo-answers-ok",
      category: "GEO",
      level: "ok",
      title: "Réponses IA",
      message: `${answers.length} bloc(s) configuré(s).`,
    });
  }

  const result: DiagnosticsResult = {
    generatedAt: new Date().toISOString(),
    summary: summarizeChecks(checks),
    checks,
  };

  diagnosticsCache = { result, expiresAt: now + DIAGNOSTICS_CACHE_TTL_MS };
  return result;
}
