import { Request, Response } from "express";
import {
  DownloadableProduct,
  DownloadPlatform,
  VatRegime,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import { getOrCreateSeoSettings } from "../services/seoSettingsService";
import { getOrCreateCompanySettings } from "../services/companySettingsService";
import { getOrCreateEmailSettings } from "../services/emailSettingsService";
import {
  getBreadcrumbStructuredData,
  getGlobalStructuredData,
  getProductStructuredData,
} from "../utils/structuredData";

type PublicDownloadableProductDTO = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  priceTtcFormatted: string;
  badge?: string | null;
  heroImageUrl?: string | null;
  screenshots?: string[];
  targetAudience?: string[];
  keyFeatures?: string[];
  priceCents?: number;
};

type PublicDownloadableProductV2DTO = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  priceTtc: number;
  currency: "EUR";
  badge?: string | null;
  tags?: string[];
  cardImageUrl?: string;
  heroImageUrl?: string;
  galleryUrls?: string[];
  detailSlides?: { imageUrl: string; description?: string | null }[];
  priceDisplayMode: "HT" | "TTC";
  isPublished: boolean;
  category?: DownloadableCategoryDTO | null;
  binaries?: PublicBinaryDTO[];
};

type PublicBinaryDTO = {
  id: string;
  platform: DownloadPlatform;
  fileName: string;
  fileSize: number;
};

type DownloadableCategoryDTO = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};

type DetailSlideDTO = { imageUrl: string; description?: string | null };

function parseDetailSlides(raw: unknown): DetailSlideDTO[] | undefined {
  if (Array.isArray(raw)) {
    const slides = raw
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const { imageUrl, description } = entry as {
            imageUrl?: string | null;
            description?: string | null;
          };
          if (typeof imageUrl === "string" && imageUrl.trim().length > 0) {
            return {
              imageUrl: imageUrl.trim(),
              description:
                typeof description === "string"
                  ? description.trim()
                  : description ?? null,
            };
          }
        }
        return null;
      })
      .filter(Boolean) as DetailSlideDTO[];

    return slides.length ? slides : undefined;
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parseDetailSlides(parsed);
    } catch (error) {
      console.warn("Impossible de parser detailSlides", error);
    }
  }

  return undefined;
}

function resolvePriceDisplayMode(vatRegime?: VatRegime | null): "HT" | "TTC" {
  if (vatRegime === VatRegime.NO_VAT_293B || vatRegime === VatRegime.OTHER) {
    return "HT";
  }
  return "TTC";
}

const formatPriceTtc = (priceCents: number, currency?: string) => {
  if (Number.isNaN(priceCents)) return "Prix à venir";
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(priceCents / 100);
  return `${formatted} TTC`;
};

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

    const publicProducts: PublicDownloadableProductDTO[] = products.map(
      (product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        shortDescription:
          product.shortDescription || "Logiciel comptable COMPTAMATCH",
        longDescription:
          product.longDescription ||
          product.shortDescription ||
          "Description à venir",
        priceTtcFormatted: formatPriceTtc(product.priceCents, product.currency),
        badge: null,
        heroImageUrl: product.thumbnailUrl || product.ogImageUrl,
        screenshots: product.thumbnailUrl ? [product.thumbnailUrl] : [],
        targetAudience: undefined,
        keyFeatures: Array.isArray(product.featureBullets)
          ? (product.featureBullets as string[])
          : undefined,
        priceCents: product.priceCents,
      })
    );

    return res.json({ products: publicProducts, structuredData });
  } catch (error) {
    console.error("Erreur lors du chargement public des téléchargements", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les produits téléchargeables." });
  }
}

export async function publicListDownloadableProductsV2(_req: Request, res: Response) {
  try {
    const [products, companySettings, categories] = await Promise.all([
      prisma.downloadableProduct.findMany({
        where: { isActive: true, isArchived: false },
        orderBy: { createdAt: "desc" },
        include: { category: true, binaries: true },
      }),
      getOrCreateCompanySettings(),
      prisma.downloadableCategory.findMany({
        orderBy: { name: "asc" },
        include: {
          products: {
            where: { isActive: true, isArchived: false },
            select: { id: true },
          },
        },
      }),
    ]);

    const priceDisplayMode = resolvePriceDisplayMode(companySettings?.vatRegime);

    const response: PublicDownloadableProductV2DTO[] = products.map((product) => {
      const category = product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : null;

      const galleryUrls: string[] = [];
      if (product.thumbnailUrl) {
        galleryUrls.push(product.thumbnailUrl);
      }
      if (product.ogImageUrl && product.ogImageUrl !== product.thumbnailUrl) {
        galleryUrls.push(product.ogImageUrl);
      }

      const tags = Array.isArray(product.featureBullets)
        ? (product.featureBullets as string[])
        : undefined;

      const detailSlides = parseDetailSlides(product.detailSlides);

      const binaries = product.binaries?.map((binary) => ({
        id: binary.id,
        platform: binary.platform,
        fileName: binary.fileName,
        fileSize: binary.fileSize,
      }));

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription || "Logiciel comptable COMPTAMATCH",
        longDescription:
          product.longDescription || product.shortDescription || "Description à venir",
        priceTtc: Math.round((product.priceCents / 100) * 100) / 100,
        currency: "EUR",
        badge: null,
        tags,
        cardImageUrl: product.cardImageUrl || product.thumbnailUrl || product.ogImageUrl || undefined,
        heroImageUrl: product.thumbnailUrl || product.ogImageUrl || undefined,
        galleryUrls: galleryUrls.length ? galleryUrls : undefined,
        detailSlides,
        priceDisplayMode,
        isPublished: product.isActive && !product.isArchived,
        category,
        binaries: binaries && binaries.length ? binaries : undefined,
      };
    });

    const publicCategories: DownloadableCategoryDTO[] = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        productCount: category.products.length,
      }))
      .filter((category) => category.productCount && category.productCount > 0);

    return res.json({ products: response, categories: publicCategories });
  } catch (error) {
    console.error("Erreur lors du chargement public des téléchargements v2", error);
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
