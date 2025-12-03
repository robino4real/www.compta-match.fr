import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createDownloadableProduct } from "./adminController";

type StatusFilter = "active" | "archived" | "all";

type DetailSlideInput = {
  imageUrl?: string | null;
  description?: string | null;
};

function parseFeatureBullets(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
      }
    } catch (error) {
      console.warn("Impossible de parser featureBullets", error);
    }
  }

  return undefined;
}

function parseDetailSlides(raw: unknown): DetailSlideInput[] | undefined {
  if (Array.isArray(raw)) {
    const slides = raw
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const { imageUrl, description } = entry as DetailSlideInput;
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
      .filter(Boolean) as DetailSlideInput[];

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

export async function listAdminDownloadableProducts(req: Request, res: Response) {
  try {
    const status = (req.query.status as StatusFilter | undefined) ?? "active";

    const where =
      status === "archived"
        ? { isArchived: true }
        : status === "all"
        ? {}
        : { isArchived: false };

    const products = await prisma.downloadableProduct.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: { category: true },
    });

    return res.status(200).json({ products });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits téléchargeables", error);
    return res.status(500).json({ message: "Impossible de récupérer les produits." });
  }
}

export async function getDownloadableProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Identifiant du produit manquant." });
    }

    const product = await prisma.downloadableProduct.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Produit téléchargeable introuvable." });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération d'un produit téléchargeable :",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la récupération du produit téléchargeable.",
    });
  }
}

export async function updateDownloadableProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Identifiant du produit manquant." });
    }

    const {
      name,
      slug,
      shortDescription,
      longDescription,
      cardImageUrl,
      priceCents,
      isActive,
      seoTitle,
      seoDescription,
      index,
      follow,
      ogImageUrl,
      thumbnailUrl,
      featureBullets,
      detailSlides,
      detailHtml,
      isArchived,
      categoryId,
    } = req.body as {
      name?: string;
      slug?: string;
      shortDescription?: string | null;
      longDescription?: string | null;
      cardImageUrl?: string | null;
      priceCents?: number;
      isActive?: boolean;
      seoTitle?: string | null;
      seoDescription?: string | null;
      index?: boolean;
      follow?: boolean;
      ogImageUrl?: string | null;
      thumbnailUrl?: string | null;
      featureBullets?: unknown;
      detailSlides?: unknown;
      detailHtml?: string | null;
      isArchived?: boolean;
      categoryId?: string | null;
    };

    const existing = await prisma.downloadableProduct.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Produit téléchargeable introuvable." });
    }

    const updateData: any = {};

    if (typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (typeof slug === "string" && slug.trim().length > 0) {
      updateData.slug = slug.trim();
    }

    if (typeof shortDescription !== "undefined") {
      updateData.shortDescription =
        shortDescription === null ? null : String(shortDescription);
    }

    if (typeof longDescription !== "undefined") {
      updateData.longDescription =
        longDescription === null ? null : String(longDescription);
    }

    if (typeof cardImageUrl !== "undefined") {
      updateData.cardImageUrl =
        cardImageUrl === null ? null : String(cardImageUrl).trim();
    }

    if (typeof priceCents !== "undefined") {
      const parsedPrice = Number(priceCents);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          message:
            "Le prix (priceCents) doit être un nombre positif (en centimes).",
        });
      }
      updateData.priceCents = Math.round(parsedPrice);
    }

    if (typeof isActive !== "undefined") {
      updateData.isActive = Boolean(isActive);
    }

    if (typeof seoTitle !== "undefined") {
      updateData.seoTitle = seoTitle === null ? null : String(seoTitle).trim();
    }

    if (typeof seoDescription !== "undefined") {
      updateData.seoDescription =
        seoDescription === null ? null : String(seoDescription).trim();
    }

    if (typeof index !== "undefined") {
      updateData.index = Boolean(index);
    }

    if (typeof follow !== "undefined") {
      updateData.follow = Boolean(follow);
    }

    if (typeof ogImageUrl !== "undefined") {
      updateData.ogImageUrl = ogImageUrl === null ? null : String(ogImageUrl).trim();
    }

    if (typeof thumbnailUrl !== "undefined") {
      updateData.thumbnailUrl =
        thumbnailUrl === null ? null : String(thumbnailUrl).trim();
    }

    if (typeof categoryId !== "undefined") {
      if (categoryId === null || categoryId === "") {
        updateData.categoryId = null;
      } else if (typeof categoryId === "string") {
        const category = await prisma.downloadableCategory.findUnique({
          where: { id: categoryId },
        });

        if (!category) {
          return res.status(400).json({ message: "Catégorie introuvable." });
        }

        updateData.categoryId = category.id;
      }
    }

    const parsedFeatureBullets = parseFeatureBullets(featureBullets);
    if (parsedFeatureBullets) {
      updateData.featureBullets = parsedFeatureBullets;
    }

    const parsedDetailSlides = parseDetailSlides(detailSlides);
    if (typeof detailSlides !== "undefined") {
      updateData.detailSlides = parsedDetailSlides ?? [];
    }

    if (typeof detailHtml !== "undefined") {
      updateData.detailHtml = detailHtml === null ? null : String(detailHtml);
    }

    if (typeof isArchived !== "undefined") {
      updateData.isArchived = Boolean(isArchived);
      updateData.archivedAt = Boolean(isArchived) ? new Date() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Aucune donnée valide à mettre à jour.",
      });
    }

    const updated = await prisma.downloadableProduct.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return res.status(200).json({ product: updated });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour d'un produit téléchargeable :",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la mise à jour du produit téléchargeable.",
    });
  }
}

export async function archiveDownloadableProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Identifiant du produit manquant." });
    }

    const updated = await prisma.downloadableProduct.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date(), isActive: false },
    });

    return res.status(200).json({ product: updated });
  } catch (error) {
    console.error("Erreur lors de l'archivage d'un produit téléchargeable", error);
    return res
      .status(500)
      .json({ message: "Impossible d'archiver ce produit téléchargeable." });
  }
}

export async function restoreDownloadableProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Identifiant du produit manquant." });
    }

    const updated = await prisma.downloadableProduct.update({
      where: { id },
      data: { isArchived: false, archivedAt: null, isActive: true },
    });

    return res.status(200).json({ product: updated });
  } catch (error) {
    console.error("Erreur lors de la restauration d'un produit téléchargeable", error);
    return res
      .status(500)
      .json({ message: "Impossible de restaurer ce produit téléchargeable." });
  }
}

export { createDownloadableProduct };
