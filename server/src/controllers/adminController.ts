import { Request, Response } from "express";
import { DownloadPlatform } from "@prisma/client";
import fs from "fs";
import { prisma } from "../config/prisma";

type DetailSlideInput = {
  imageUrl?: string | null;
  description?: string | null;
};

const SUPPORTED_PLATFORMS: DownloadPlatform[] = [
  DownloadPlatform.WINDOWS,
  DownloadPlatform.MACOS,
];

function parsePlatform(raw: unknown): DownloadPlatform | null {
  if (typeof raw !== "string") return null;
  const upper = raw.trim().toUpperCase();
  return SUPPORTED_PLATFORMS.includes(upper as DownloadPlatform)
    ? (upper as DownloadPlatform)
    : null;
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

export async function listUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return res.json({ users });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des utilisateurs." });
  }
}

export async function createDownloadableProduct(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    const {
      name,
      slug,
      priceCents,
      shortDescription,
      longDescription,
      cardImageUrl,
      thumbnailUrl,
      featureBullets,
      detailHtml,
      detailSlides,
      categoryId,
      platform,
    } = req.body;

    if (!file) {
      return res.status(400).json({ message: "Aucun fichier reçu." });
    }

    if (!name || !priceCents) {
      return res
        .status(400)
        .json({ message: "Les champs 'name' et 'priceCents' sont obligatoires." });
    }

    const parsedPlatform = parsePlatform(platform);
    if (!parsedPlatform) {
      return res.status(400).json({
        message: "La plateforme doit être définie (Windows ou MacOS).",
      });
    }

    const price = Number(priceCents);
    if (!Number.isFinite(price) || price <= 0) {
      return res
        .status(400)
        .json({ message: "Le champ 'priceCents' doit être un entier positif." });
    }

    let finalSlug = slug;
    if (!finalSlug || typeof finalSlug !== "string" || finalSlug.trim() === "") {
      finalSlug = name
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    let parsedFeatureBullets: string[] | undefined;
    if (Array.isArray(featureBullets)) {
      parsedFeatureBullets = featureBullets.filter(
        (entry: unknown) => typeof entry === "string" && entry.trim().length > 0
      );
    } else if (typeof featureBullets === "string") {
      try {
        const parsed = JSON.parse(featureBullets);
        if (Array.isArray(parsed)) {
          parsedFeatureBullets = parsed.filter(
            (entry: unknown) => typeof entry === "string" && entry.trim().length > 0
          ) as string[];
        }
      } catch (error) {
        console.warn("Impossible de parser featureBullets", error);
      }
    }

    const parsedDetailSlides = parseDetailSlides(detailSlides);

    let validCategoryId: string | null = null;
    if (typeof categoryId === "string" && categoryId.trim()) {
      const existingCategory = await prisma.downloadableCategory.findUnique({
        where: { id: categoryId.trim() },
      });

      if (!existingCategory) {
        return res.status(400).json({ message: "Catégorie introuvable." });
      }

      validCategoryId = existingCategory.id;
    }

    const product = await prisma.downloadableProduct.create({
      data: {
        slug: finalSlug,
        name,
        shortDescription: shortDescription || null,
        longDescription: longDescription || null,
        cardImageUrl: cardImageUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        featureBullets: parsedFeatureBullets,
        detailSlides: parsedDetailSlides ?? [],
        detailHtml: detailHtml || null,
        priceCents: Math.round(price),
        currency: "EUR",
        isActive: true,
        categoryId: validCategoryId,
        fileName: file.originalname,
        fileSize: file.size,
        fileMimeType: file.mimetype || null,
        storagePath: file.path,
      },
    });

    await prisma.downloadableBinary.create({
      data: {
        productId: product.id,
        platform: parsedPlatform,
        fileName: file.originalname,
        fileSize: file.size,
        fileMimeType: file.mimetype || null,
        storagePath: file.path,
      },
    });

    return res.status(201).json({ product });
  } catch (error) {
    console.error(
      "Erreur lors de la création d'un produit téléchargeable :",
      error
    );
    return res
      .status(500)
      .json({ message: "Erreur lors de la création du produit téléchargeable." });
  }
}

export async function adminUploadAsset(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ message: "Aucun fichier reçu." });
    }

    if (file.mimetype && !file.mimetype.startsWith("image/")) {
      return res
        .status(400)
        .json({ message: "Seuls les fichiers image peuvent être importés." });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/${encodeURIComponent(file.filename)}`;

    return res.status(201).json({
      url,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload d'un fichier", error);
    return res
      .status(500)
      .json({ message: "Impossible de téléverser ce fichier pour le moment." });
  }
}
