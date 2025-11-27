import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function listCatalogDownloads(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === "true";

    const products = await prisma.downloadableProduct.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ products });
  } catch (error) {
    console.error("Erreur lors du chargement des téléchargements catalog", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les produits téléchargeables." });
  }
}
