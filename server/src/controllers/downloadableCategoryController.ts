import { Request, Response } from "express";
import { prisma } from "../config/prisma";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function adminListDownloadableCategories(_req: Request, res: Response) {
  try {
    const categories = await prisma.downloadableCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });

    return res.status(200).json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        productCount: category._count.products,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories de téléchargement", error);
    return res
      .status(500)
      .json({ message: "Impossible de récupérer les catégories pour le moment." });
  }
}

export async function adminCreateDownloadableCategory(req: Request, res: Response) {
  try {
    const { name, slug } = req.body as { name?: string; slug?: string };

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Le nom de la catégorie est requis." });
    }

    const finalSlug = slug?.trim() || slugify(name);

    const existing = await prisma.downloadableCategory.findFirst({
      where: { OR: [{ slug: finalSlug }, { name: name.trim() }] },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Une catégorie avec ce nom ou ce slug existe déjà." });
    }

    const category = await prisma.downloadableCategory.create({
      data: { name: name.trim(), slug: finalSlug },
    });

    return res.status(201).json({ category });
  } catch (error) {
    console.error("Erreur lors de la création d'une catégorie de téléchargement", error);
    return res
      .status(500)
      .json({ message: "Impossible de créer la catégorie pour le moment." });
  }
}

export async function adminDeleteDownloadableCategory(req: Request, res: Response) {
  try {
    const { id } = req.params as { id?: string };

    if (!id) {
      return res.status(400).json({ message: "Identifiant de catégorie manquant." });
    }

    const usageCount = await prisma.downloadableProduct.count({
      where: { categoryId: id },
    });

    if (usageCount > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer une catégorie utilisée par des produits.",
      });
    }

    await prisma.downloadableCategory.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error("Erreur lors de la suppression d'une catégorie de téléchargement", error);
    return res
      .status(500)
      .json({ message: "Impossible de supprimer cette catégorie pour le moment." });
  }
}
