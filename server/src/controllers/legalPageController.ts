import { Request, Response } from "express";
import {
  createMissingLegalPages,
  getLegalPageById,
  getPublishedLegalPage,
  listLegalPages,
  updateLegalPage,
} from "../services/legalPageService";

export async function adminListLegalPages(_req: Request, res: Response) {
  try {
    const pages = await listLegalPages();
    return res.json({ pages });
  } catch (error) {
    console.error("Erreur lors de la récupération des pages légales", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les pages légales." });
  }
}

export async function adminCreateDefaultLegalPages(_req: Request, res: Response) {
  try {
    const created = await createMissingLegalPages();
    const pages = await listLegalPages();
    return res.json({
      createdCount: created.length,
      pages,
      message:
        created.length > 0
          ? "Pages légales créées avec succès."
          : "Toutes les pages légales existent déjà.",
    });
  } catch (error) {
    console.error("Erreur lors de la création des pages légales par défaut", error);
    return res
      .status(500)
      .json({ message: "Impossible de créer les pages légales." });
  }
}

export async function adminGetLegalPage(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const page = await getLegalPageById(id);
    if (!page) {
      return res.status(404).json({ message: "Page légale introuvable." });
    }

    return res.json({ page });
  } catch (error) {
    console.error("Erreur lors de la récupération d'une page légale", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger la page légale." });
  }
}

export async function adminUpdateLegalPage(req: Request, res: Response) {
  const { id } = req.params;
  const payload = req.body || {};

  try {
    const existing = await getLegalPageById(id);
    if (!existing) {
      return res.status(404).json({ message: "Page légale introuvable." });
    }

    const updated = await updateLegalPage(id, payload);
    return res.json({
      page: updated,
      message: "Page légale mise à jour avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la page légale", error);
    return res
      .status(500)
      .json({ message: "Impossible de mettre à jour la page légale." });
  }
}

export async function publicGetLegalPage(req: Request, res: Response) {
  const { identifier } = req.params;
  try {
    const page = await getPublishedLegalPage(identifier);
    if (!page) {
      return res
        .status(404)
        .json({ message: "Le contenu n'est pas encore disponible." });
    }

    return res.json({ page });
  } catch (error) {
    console.error("Erreur lors du chargement public d'une page légale", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger la page légale demandée." });
  }
}
