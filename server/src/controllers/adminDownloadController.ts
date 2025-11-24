import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createDownloadableProduct } from "./adminController";

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
      shortDescription,
      longDescription,
      priceCents,
      isActive,
    } = req.body as {
      name?: string;
      shortDescription?: string | null;
      longDescription?: string | null;
      priceCents?: number;
      isActive?: boolean;
    };

    const existing = await prisma.downloadableProduct.findUnique({
      where: { id },
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

    if (typeof shortDescription !== "undefined") {
      updateData.shortDescription =
        shortDescription === null ? null : String(shortDescription);
    }

    if (typeof longDescription !== "undefined") {
      updateData.longDescription =
        longDescription === null ? null : String(longDescription);
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

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Aucune donnée valide à mettre à jour.",
      });
    }

    const updated = await prisma.downloadableProduct.update({
      where: { id },
      data: updateData,
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

export { createDownloadableProduct };
