import fs from "fs";
import { Request, Response } from "express";
import {
  CompanySettings,
  CustomPage,
  DownloadableProduct,
  GeoFaqItem,
  GeoIdentity,
  PageSeo,
  ProductSeo,
  SeoSettingsV2,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  getGeoIdentitySingleton,
  getSeoSettingsSingleton,
} from "../services/seoGeoAdminService";
import { getOrCreateCompanySettings } from "../services/companySettingsService";

const CACHE_TTL_MS = 60 * 1000;
const DEFAULT_CANONICAL_BASE = "https://www.compta-match.fr";

let cachedTemplate: { indexPath: string; html: string } | null = null;
let cachedGlobals:
  | {
      expiresAt: number;
      seoSettings: SeoSettingsV2;
      geoIdentity: GeoIdentity | null;
      companySettings: CompanySettings;
      faqItems: GeoFaqItem[];
    }
  | null = null;

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  if (pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length === 0 ? "/" : trimmed;
}

function buildCanonical(baseUrl: string | null | undefined, pathname: string) {
  const base = (baseUrl || DEFAULT_CANONICAL_BASE).replace(/\/$/, "");
  const pathPart = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${pathPart}`;
}

async function getIndexTemplate(indexPath: string): Promise<string | null> {
  if (cachedTemplate && cachedTemplate.indexPath === indexPath) {
    return cachedTemplate.html;
  }

  try {
    const html = await fs.promises.readFile(indexPath, "utf-8");
    cachedTemplate = { indexPath, html };
    return html;
  } catch (error) {
    console.error("[seo] Impossible de lire le template index.html", error);
    return null;
  }
}

async function getGlobals() {
  const now = Date.now();
  if (cachedGlobals && cachedGlobals.expiresAt > now) return cachedGlobals;

  const [seoSettings, geoIdentity, companySettings, faqItems] = await Promise.all([
    getSeoSettingsSingleton(),
    getGeoIdentitySingleton().catch(() => null),
    getOrCreateCompanySettings(),
    prisma.geoFaqItem
      .findMany({
        orderBy: [
          { order: "asc" },
          { createdAt: "asc" },
        ],
      })
      .catch(() => []),
  ]);

  cachedGlobals = {
    expiresAt: now + CACHE_TTL_MS,
    seoSettings,
    geoIdentity,
    companySettings,
    faqItems,
  };

  return cachedGlobals;
}

type SeoContext =
  | { type: "default" }
  | { type: "page"; page: CustomPage; pageSeo: PageSeo | null }
  | { type: "product"; product: DownloadableProduct; productSeo: ProductSeo | null };

async function resolveSeoContext(pathname: string): Promise<SeoContext> {
  const normalizedPath = normalizePathname(pathname);

  if (!normalizedPath.startsWith("/admin")) {
    const productMatch = normalizedPath.match(/^\/(telechargements|logiciels)\/([^/]+)$/i);
    if (productMatch) {
      const slug = productMatch[2];
      const product = await prisma.downloadableProduct.findFirst({
        where: { slug, isActive: true, isArchived: false },
        include: { seoOverride: true },
      });

      if (product) {
        return { type: "product", product, productSeo: product.seoOverride };
      }
    }

    const page = await prisma.customPage.findFirst({
      where: { route: normalizedPath, status: "ACTIVE" },
      include: { seo: true },
    });

    if (page) {
      return { type: "page", page, pageSeo: page.seo ?? null };
    }
  }

  return { type: "default" };
}

function resolveTitle(
  siteName: string,
  defaultTitle: string | null,
  overrideTitle?: string | null
) {
  if (overrideTitle && overrideTitle.trim().length > 0) {
    return siteName ? `${overrideTitle.trim()} | ${siteName}` : overrideTitle.trim();
  }
  return defaultTitle || siteName || "";
}

function pickDescription(
  overrideDescription?: string | null,
  fallback?: string | null,
  defaultDescription?: string | null
) {
  return overrideDescription?.trim() || fallback?.trim() || defaultDescription?.trim() || null;
}

function pickOgImage(
  overrideImage?: string | null,
  fallback?: string | null,
  defaultImage?: string | null
) {
  return overrideImage?.trim() || fallback?.trim() || defaultImage?.trim() || null;
}

function computeRobots(
  globalIndex: boolean | null | undefined,
  globalFollow: boolean | null | undefined,
  overrideIndex?: boolean | null,
  overrideFollow?: boolean | null
) {
  const effectiveIndex = typeof overrideIndex === "boolean" ? overrideIndex : globalIndex !== false;
  const effectiveFollow = typeof overrideFollow === "boolean" ? overrideFollow : globalFollow !== false;
  return `${effectiveIndex ? "index" : "noindex"},${effectiveFollow ? "follow" : "nofollow"}`;
}

type ComputedSeo = {
  title: string;
  description: string | null;
  canonicalUrl: string | null;
  robots: string;
  og: {
    title: string;
    description: string | null;
    image: string | null;
    url: string | null;
    type: "website" | "product";
    siteName: string;
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string | null;
    image: string | null;
  };
};

function buildSeoForContext(
  pathname: string,
  globals: Awaited<ReturnType<typeof getGlobals>>,
  context: SeoContext
): ComputedSeo {
  const normalizedPath = normalizePathname(pathname);
  const siteName = globals.seoSettings.siteName?.trim() || "ComptaMatch";
  const canonicalBase = globals.seoSettings.canonicalBaseUrl?.trim() || DEFAULT_CANONICAL_BASE;
  const defaultTitle = globals.seoSettings.defaultTitle?.trim() || siteName;
  const defaultDescription = globals.seoSettings.defaultDescription?.trim() || null;
  const defaultOg = globals.seoSettings.defaultOgImageUrl?.trim() || null;

  let titleSource: string | null | undefined = null;
  let descriptionSource: string | null | undefined = null;
  let ogImageSource: string | null | undefined = null;
  let canonicalOverride: string | null | undefined = null;
  let robotsIndexOverride: boolean | null | undefined = null;
  let robotsFollowOverride: boolean | null | undefined = null;
  let ogType: "website" | "product" = "website";

  if (context.type === "page") {
    titleSource = context.pageSeo?.title || context.page.name;
    descriptionSource = context.pageSeo?.description || null;
    ogImageSource = context.pageSeo?.ogImageUrl || null;
    canonicalOverride = context.pageSeo?.canonicalUrl || null;
    robotsIndexOverride = context.pageSeo?.robotsIndex ?? null;
    robotsFollowOverride = context.pageSeo?.robotsFollow ?? null;
  } else if (context.type === "product") {
    titleSource = context.productSeo?.title || context.product.seoTitle || context.product.name;
    descriptionSource =
      context.productSeo?.description ||
      context.product.seoDescription ||
      context.product.shortDescription ||
      context.product.longDescription ||
      null;
    ogImageSource = context.productSeo?.ogImageUrl || context.product.ogImageUrl || null;
    canonicalOverride = context.productSeo?.canonicalUrl || null;
    robotsIndexOverride = context.productSeo?.robotsIndex ?? context.product.index;
    robotsFollowOverride = context.productSeo?.robotsFollow ?? context.product.follow;
    ogType = "product";
  }

  const title = resolveTitle(siteName, defaultTitle, titleSource);
  const description = pickDescription(descriptionSource, null, defaultDescription);
  const ogImage = pickOgImage(ogImageSource, null, defaultOg);
  const canonicalUrl = canonicalOverride || buildCanonical(canonicalBase, normalizedPath);
  const robots = computeRobots(
    globals.seoSettings.defaultRobotsIndex,
    globals.seoSettings.defaultRobotsFollow,
    robotsIndexOverride,
    robotsFollowOverride
  );

  const twitterCard = ogImage ? "summary_large_image" : "summary";

  return {
    title,
    description,
    canonicalUrl,
    robots,
    og: {
      title,
      description,
      image: ogImage,
      url: canonicalUrl,
      type: ogType,
      siteName,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      image: ogImage,
    },
  };
}

function buildJsonLd(
  pathname: string,
  globals: Awaited<ReturnType<typeof getGlobals>>,
  context: SeoContext,
  meta: ComputedSeo
) {
  const normalizedPath = normalizePathname(pathname);
  const payloads: any[] = [];
  const canonicalBase = globals.seoSettings.canonicalBaseUrl?.trim() || DEFAULT_CANONICAL_BASE;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: globals.seoSettings.siteName || globals.companySettings.companyName,
    url: canonicalBase,
    logo: globals.companySettings.logoUrl || globals.seoSettings.defaultOgImageUrl || undefined,
    description:
      globals.geoIdentity?.shortDescription ||
      globals.geoIdentity?.longDescription ||
      globals.seoSettings.defaultDescription ||
      undefined,
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: globals.seoSettings.siteName || globals.companySettings.companyName,
    url: canonicalBase,
  };

  payloads.push(organization, webSite);

  if (
    (normalizedPath === "/" || normalizedPath === "/faq") &&
    globals.faqItems &&
    globals.faqItems.length > 0
  ) {
    const faq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: globals.faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };
    payloads.push(faq);
  }

  if (context.type === "product") {
    const price =
      typeof context.product.priceCents === "number"
        ? (context.product.priceCents / 100).toFixed(2)
        : undefined;
    const productJson = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: meta.title,
      description: meta.description || undefined,
      applicationCategory: "FinanceApplication",
      operatingSystem: "All",
      image: meta.og.image || undefined,
      offers: price
        ? {
            "@type": "Offer",
            price,
            priceCurrency: context.product.currency || "EUR",
            availability: "http://schema.org/InStock",
            url: meta.canonicalUrl || undefined,
          }
        : undefined,
    };
    payloads.push(productJson);
  }

  return payloads;
}

function removeExistingHeadTags(html: string) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, "");
}

function injectSeo(html: string, meta: ComputedSeo, jsonLd: any[]) {
  const cleaned = removeExistingHeadTags(html);
  const headInjection = `
<title>${escapeHtml(meta.title)}</title>
${
  meta.description
    ? `<meta name="description" content="${escapeHtml(meta.description)}">`
    : ""
}
<meta name="robots" content="${escapeHtml(meta.robots)}">
${
  meta.canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}">`
    : ""
}
<meta property="og:title" content="${escapeHtml(meta.og.title)}">
${
  meta.og.description
    ? `<meta property="og:description" content="${escapeHtml(meta.og.description)}">`
    : ""
}
<meta property="og:type" content="${meta.og.type}">
${meta.og.image ? `<meta property="og:image" content="${escapeHtml(meta.og.image)}">` : ""}
${meta.og.url ? `<meta property="og:url" content="${escapeHtml(meta.og.url)}">` : ""}
<meta property="og:site_name" content="${escapeHtml(meta.og.siteName)}">
<meta name="twitter:card" content="${meta.twitter.card}">
<meta name="twitter:title" content="${escapeHtml(meta.twitter.title)}">
${
  meta.twitter.description
    ? `<meta name="twitter:description" content="${escapeHtml(meta.twitter.description)}">`
    : ""
}
${meta.twitter.image ? `<meta name="twitter:image" content="${escapeHtml(meta.twitter.image)}">` : ""}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
`;

  if (cleaned.match(/<head[^>]*>/i)) {
    return cleaned.replace(/<head[^>]*>/i, (match) => `${match}\n${headInjection}`);
  }

  if (cleaned.match(/<\/head>/i)) {
    return cleaned.replace(/<\/head>/i, `${headInjection}\n</head>`);
  }

  return `${headInjection}\n${cleaned}`;
}

export async function renderIndexWithSeo(params: {
  req: Request;
  res: Response;
  indexPath: string;
}) {
  const template = await getIndexTemplate(params.indexPath);
  if (!template) {
    return params.res.sendFile(params.indexPath);
  }

  try {
    const [globals, context] = await Promise.all([
      getGlobals(),
      resolveSeoContext(params.req.path),
    ]);

    const meta = buildSeoForContext(params.req.path, globals, context);
    const jsonLd = buildJsonLd(params.req.path, globals, context, meta);
    const finalHtml = injectSeo(template, meta, jsonLd);

    return params.res.send(finalHtml);
  } catch (error) {
    console.error("[seo] Erreur lors de l'injection SEO", error);
    return params.res.sendFile(params.indexPath);
  }
}
