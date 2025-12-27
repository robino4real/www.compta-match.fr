import { Request, Response } from "express";
import { SeoSettingsV2 } from "@prisma/client";
import {
  getOrCreateSeoSettings,
  updateSeoSettings,
} from "../services/seoSettingsService";
import {
  ensureDefaultSeoStaticPages,
  listSeoStaticPages,
  updateSeoStaticPage,
} from "../services/seoStaticPageService";
import { prisma } from "../config/prisma";
import { getOrCreateHomepageSettings } from "../services/homepageSettingsService";
import { getSeoSettingsSingleton } from "../services/seoGeoAdminService";

export async function adminGetSeoSettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateSeoSettings();
    return res.json({ settings });
  } catch (error) {
    console.error("Erreur lors du chargement des paramètres SEO", error);
    return res.status(500).json({ message: "Impossible de charger les paramètres SEO." });
  }
}

export async function adminSaveSeoSettings(req: Request, res: Response) {
  try {
    const settings = await updateSeoSettings(req.body || {});
    return res.json({ settings, message: "Paramètres SEO enregistrés" });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des paramètres SEO", error);
    return res.status(500).json({ message: "Impossible d'enregistrer les paramètres SEO." });
  }
}

export async function adminListSeoStaticPages(_req: Request, res: Response) {
  try {
    const pages = await listSeoStaticPages();
    return res.json({ pages });
  } catch (error) {
    console.error("Erreur lors du chargement des pages statiques SEO", error);
    return res.status(500).json({ message: "Impossible de charger les pages statiques." });
  }
}

export async function adminUpdateSeoStaticPage(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const updated = await updateSeoStaticPage(id, req.body || {});
    if (!updated) {
      return res.status(404).json({ message: "Page statique introuvable." });
    }
    return res.json({ page: updated, message: "Page statique mise à jour." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour SEO de la page statique", error);
    return res.status(500).json({ message: "Impossible de mettre à jour cette page statique." });
  }
}

export async function adminSeedSeoStaticPages(_req: Request, res: Response) {
  try {
    await ensureDefaultSeoStaticPages();
    const pages = await listSeoStaticPages();
    return res.json({ pages, message: "Pages statiques initialisées" });
  } catch (error) {
    console.error("Erreur lors de l'initialisation des pages statiques", error);
    return res.status(500).json({ message: "Impossible d'initialiser les pages statiques." });
  }
}

const DEFAULT_CANONICAL_BASE = "https://www.compta-match.fr";
const PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000;

let robotsCache: { content: string; expiresAt: number } | null = null;
let sitemapCache: { xml: string; expiresAt: number } | null = null;

function normalizeBaseUrl(baseUrl?: string | null) {
  if (!baseUrl) return DEFAULT_CANONICAL_BASE;
  return baseUrl.replace(/\/$/, "");
}

function buildRobotsFromSettings(settings: SeoSettingsV2 | null) {
  if (settings?.robotsTxt && settings.robotsTxt.trim().length > 0) {
    return settings.robotsTxt;
  }

  const baseUrl = normalizeBaseUrl(settings?.canonicalBaseUrl);
  const lines = ["User-agent: *"];
  const shouldIndex = settings?.defaultRobotsIndex !== false;
  lines.push(shouldIndex ? "Allow: /" : "Disallow: /");
  lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);

  return lines.join("\n");
}

export async function robotsTxtHandler(_req: Request, res: Response) {
  const now = Date.now();
  if (robotsCache && robotsCache.expiresAt > now) {
    res
      .set("Content-Type", "text/plain; charset=utf-8")
      .set("Cache-Control", "public, max-age=300")
      .send(robotsCache.content);
    return;
  }

  try {
    const settings = await getSeoSettingsSingleton().catch(() => null);
    const content = buildRobotsFromSettings(settings);

    robotsCache = { content, expiresAt: now + PUBLIC_CACHE_TTL_MS };

    res
      .set("Content-Type", "text/plain; charset=utf-8")
      .set("Cache-Control", "public, max-age=300")
      .send(content);
  } catch (error) {
    console.error("Erreur lors de la génération du robots.txt", error);
    const fallback = "User-agent: *\nAllow: /\nSitemap: https://www.compta-match.fr/sitemap.xml";
    res
      .status(500)
      .set("Content-Type", "text/plain; charset=utf-8")
      .set("Cache-Control", "public, max-age=300")
      .send(fallback);
  }
}

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

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

export async function sitemapHandler(_req: Request, res: Response) {
  const now = Date.now();
  if (sitemapCache && sitemapCache.expiresAt > now) {
    res
      .set("Content-Type", "application/xml; charset=utf-8")
      .set("Cache-Control", "public, max-age=300")
      .send(sitemapCache.xml);
    return;
  }

  try {
    const settings = await getSeoSettingsSingleton();
    const baseUrl = normalizeBaseUrl(settings.canonicalBaseUrl);

    const includePages = settings.sitemapEnabled && settings.sitemapIncludePages;
    const includeProducts = settings.sitemapEnabled && settings.sitemapIncludeProducts;
    const includeArticles = settings.sitemapEnabled && settings.sitemapIncludeArticles;

    const [homepageSettings, pages, products, articles] = await Promise.all([
      getOrCreateHomepageSettings().catch(() => null),
      includePages
        ? prisma.customPage.findMany({
            where: { status: "ACTIVE" },
            select: { route: true, updatedAt: true },
          })
        : [],
      includeProducts
        ? prisma.downloadableProduct.findMany({
            where: { isActive: true, isArchived: false },
            select: { slug: true, updatedAt: true },
          })
        : [],
      includeArticles
        ? prisma.article.findMany({
            where: { status: "PUBLISHED" },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
          })
        : [],
    ]);

    const urls: SitemapEntry[] = [];

    urls.push({
      loc: `${baseUrl}/`,
      lastmod: homepageSettings?.updatedAt?.toISOString(),
      changefreq: "weekly",
      priority: "1.0",
    });

    pages.forEach((page) => {
      const route = page.route.startsWith("/") ? page.route : `/${page.route}`;
      urls.push({
        loc: `${baseUrl}${route}`,
        lastmod: page.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: "0.7",
      });
    });

    if (settings.sitemapEnabled && includeArticles) {
      urls.push({ loc: `${baseUrl}/articles`, changefreq: "weekly", priority: "0.7" });
    }

    articles.forEach((article) => {
      urls.push({
        loc: `${baseUrl}/articles/${article.slug}`,
        lastmod: article.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: "0.7",
      });
    });

    products.forEach((product) => {
      urls.push({
        loc: `${baseUrl}/telechargements/${product.slug}`,
        lastmod: product.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: "0.7",
      });
    });

    const xml = buildSitemapXml(urls);
    sitemapCache = { xml, expiresAt: now + PUBLIC_CACHE_TTL_MS };

    res
      .set("Content-Type", "application/xml; charset=utf-8")
      .set("Cache-Control", "public, max-age=300")
      .send(xml);
  } catch (error) {
    console.error("Erreur lors de la génération du sitemap", error);
    const fallback = buildSitemapXml([{ loc: `${DEFAULT_CANONICAL_BASE}/` }]);
    res
      .status(500)
      .set("Content-Type", "application/xml; charset=utf-8")
      .set("Cache-Control", "public, max-age=300")
      .send(fallback);
  }
}
