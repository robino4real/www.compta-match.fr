import { Request, Response } from "express";
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

export async function robotsTxtHandler(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateSeoSettings();
    if (settings.customRobotsTxt && settings.customRobotsTxt.trim().length > 0) {
      res.type("text/plain").send(settings.customRobotsTxt);
      return;
    }

    const lines = ["User-agent: *"];
    if (!settings.indexSite) {
      lines.push("Disallow: /");
    } else {
      lines.push("Allow: /");
      if (settings.enableSitemap && settings.canonicalBaseUrl) {
        lines.push(`Sitemap: ${settings.canonicalBaseUrl.replace(/\/$/, "")}/sitemap.xml`);
      }
    }

    res.type("text/plain").send(lines.join("\n"));
  } catch (error) {
    console.error("Erreur lors de la génération du robots.txt", error);
    res.status(500).type("text/plain").send("User-agent: *\nDisallow: /");
  }
}

export async function sitemapHandler(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateSeoSettings();
    if (!settings.enableSitemap || !settings.canonicalBaseUrl) {
      return res.status(404).send("Sitemap désactivé");
    }

    const baseUrl = settings.canonicalBaseUrl.replace(/\/$/, "");

    const homepageSettings = await getOrCreateHomepageSettings();
    const staticPages = await listSeoStaticPages();
    const legalPages = await prisma.legalPage.findMany({ where: { isPublished: true } });
    const articles = await prisma.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { updatedAt: "desc" } });
    const products = await prisma.downloadableProduct.findMany({ where: { isActive: true } });

    type UrlEntry = { loc: string; lastmod?: string };
    const urls: UrlEntry[] = [];

    urls.push({ loc: `${baseUrl}/`, lastmod: homepageSettings.updatedAt?.toISOString() });

    staticPages.forEach((page) => {
      urls.push({ loc: `${baseUrl}${page.route}`, lastmod: page.updatedAt.toISOString() });
    });

    legalPages.forEach((page) => {
      urls.push({ loc: `${baseUrl}/${page.slug}`, lastmod: page.updatedAt.toISOString() });
    });

    urls.push({ loc: `${baseUrl}/articles` });
    articles.forEach((article) => {
      urls.push({ loc: `${baseUrl}/articles/${article.slug}`, lastmod: article.updatedAt.toISOString() });
    });

    products.forEach((product) => {
      urls.push({ loc: `${baseUrl}/telechargements/${product.slug}`, lastmod: product.updatedAt.toISOString() });
    });

    const xmlItems = urls
      .map((url) => {
        return `<url><loc>${url.loc}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}</url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xmlItems}</urlset>`;
    res.type("application/xml").send(xml);
  } catch (error) {
    console.error("Erreur lors de la génération du sitemap", error);
    res.status(500).send("Impossible de générer le sitemap");
  }
}
