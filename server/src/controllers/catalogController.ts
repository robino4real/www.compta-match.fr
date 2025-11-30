import { Request, Response } from "express";
import { DownloadableProduct } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getOrCreateSeoSettings } from "../services/seoSettingsService";
import { getOrCreateCompanySettings } from "../services/companySettingsService";
import { getOrCreateEmailSettings } from "../services/emailSettingsService";
import {
  getBreadcrumbStructuredData,
  getGlobalStructuredData,
  getProductStructuredData,
} from "../utils/structuredData";

function buildProductStructuredData(
  products: DownloadableProduct[],
  companySettings: any,
  seoSettings: any,
  emailSettings: any
) {
  const baseStructuredData = [
    ...getGlobalStructuredData({ seoSettings, companySettings, emailSettings }),
  ];

  const productData = products.flatMap((product) =>
    getProductStructuredData({
      seoSettings,
      product,
      canonicalPath: `/telechargements/${product.slug}`,
      companySettings,
    })
  );

  const breadcrumb = getBreadcrumbStructuredData({
    seoSettings,
    items: [
      { name: "Accueil", path: "/" },
      { name: "Téléchargements", path: "/telechargements" },
    ],
  });

  const structuredData = [...baseStructuredData, ...productData];
  if (breadcrumb) {
    structuredData.push(breadcrumb);
  }

  return structuredData;
}

export async function listCatalogDownloads(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === "true";

    const products = await prisma.downloadableProduct.findMany({
      where: includeInactive
        ? {}
        : {
            isActive: true,
            isArchived: false,
          },
      orderBy: { createdAt: "desc" },
    });

    const [seoSettings, companySettings, emailSettings] = await Promise.all([
      getOrCreateSeoSettings(),
      getOrCreateCompanySettings(),
      getOrCreateEmailSettings(),
    ]);

    const structuredData = buildProductStructuredData(
      products,
      companySettings,
      seoSettings,
      emailSettings
    );

    return res.json({ products, structuredData });
  } catch (error) {
    console.error("Erreur lors du chargement des téléchargements catalog", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les produits téléchargeables." });
  }
}

export async function publicListDownloadableProducts(_req: Request, res: Response) {
  try {
    const products = await prisma.downloadableProduct.findMany({
      where: { isActive: true, isArchived: false },
      orderBy: { createdAt: "desc" },
    });

    const [seoSettings, companySettings, emailSettings] = await Promise.all([
      getOrCreateSeoSettings(),
      getOrCreateCompanySettings(),
      getOrCreateEmailSettings(),
    ]);

    const structuredData = buildProductStructuredData(
      products,
      companySettings,
      seoSettings,
      emailSettings
    );

    const publicProducts = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      thumbnailUrl: product.thumbnailUrl,
      shortDescription: product.shortDescription,
      featureBullets: Array.isArray(product.featureBullets)
        ? (product.featureBullets as string[])
        : [],
      priceCents: product.priceCents,
      detailHtml: product.detailHtml,
    }));

    return res.json({ products: publicProducts, structuredData });
  } catch (error) {
    console.error("Erreur lors du chargement public des téléchargements", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les produits téléchargeables." });
  }
}

export async function publicGetDownloadableProduct(req: Request, res: Response) {
  try {
    const { slug } = req.params as { slug?: string };

    if (!slug) {
      return res.status(400).json({ message: "Identifiant du produit manquant." });
    }

    const product = await prisma.downloadableProduct.findFirst({
      where: { slug, isActive: true, isArchived: false },
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Produit téléchargeable introuvable." });
    }

    const [seoSettings, companySettings, emailSettings] = await Promise.all([
      getOrCreateSeoSettings(),
      getOrCreateCompanySettings(),
      getOrCreateEmailSettings(),
    ]);

    const structuredData = buildProductStructuredData(
      [product],
      companySettings,
      seoSettings,
      emailSettings
    );

    return res.json({ product, structuredData });
  } catch (error) {
    console.error(
      "Erreur lors du chargement d'un produit téléchargeable public",
      error
    );
    return res
      .status(500)
      .json({ message: "Impossible de charger ce produit téléchargeable." });
  }
}
