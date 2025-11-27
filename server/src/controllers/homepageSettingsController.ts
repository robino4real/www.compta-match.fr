import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  getOrCreateHomepageSettings,
  updateHomepageSettings,
} from "../services/homepageSettingsService";

function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const orderMap = ids.reduce<Record<string, number>>((acc, id, index) => {
    acc[id] = index;
    return acc;
  }, {});

  return [...items].sort((a, b) => (orderMap[a.id] ?? 0) - (orderMap[b.id] ?? 0));
}

export async function adminGetHomepageSettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateHomepageSettings();
    const availableProducts = await prisma.downloadableProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return res.json({ settings, availableProducts });
  } catch (error) {
    console.error("Erreur lors du chargement de la home admin", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les réglages de la home." });
  }
}

export async function adminSaveHomepageSettings(req: Request, res: Response) {
  try {
    const settings = await updateHomepageSettings(req.body || {});
    return res.json({ settings, message: "Page d'accueil mise à jour." });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la home", error);
    return res
      .status(500)
      .json({ message: "Impossible d'enregistrer la page d'accueil." });
  }
}

export async function publicGetHomepageSettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateHomepageSettings();
    const highlightedIds = Array.isArray(settings.highlightedProductIds)
      ? (settings.highlightedProductIds as unknown[])
          .map((id) => (id == null ? null : String(id)))
          .filter((id): id is string => Boolean(id))
      : [];

    let highlightedProducts: any[] = [];
    if (highlightedIds.length > 0) {
      const products = await prisma.downloadableProduct.findMany({
        where: {
          id: { in: highlightedIds },
          isActive: true,
        },
      });

      highlightedProducts = orderByIds(products, highlightedIds);
    }

    return res.json({ settings, highlightedProducts });
  } catch (error) {
    console.error("Erreur lors du chargement public de la home", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger la page d'accueil." });
  }
}
