import { Request, Response } from "express";
import { prisma } from "../config/prisma";

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
    const { name, slug, priceCents, shortDescription, longDescription } =
      req.body;

    if (!file) {
      return res.status(400).json({ message: "Aucun fichier reçu." });
    }

    if (!name || !priceCents) {
      return res
        .status(400)
        .json({ message: "Les champs 'name' et 'priceCents' sont obligatoires." });
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

    const product = await prisma.downloadableProduct.create({
      data: {
        slug: finalSlug,
        name,
        shortDescription: shortDescription || null,
        longDescription: longDescription || null,
        priceCents: Math.round(price),
        currency: "EUR",
        isActive: true,
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
