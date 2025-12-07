import { Request, Response } from "express";
import {
  createCustomPage,
  createPageBlock,
  createPageSection,
  deleteCustomPage,
  deletePageBlock,
  deletePageSection,
  getAllCustomPages,
  getCustomPageWithStructureById,
  getPublishedCustomPageByRoute,
  createWhyChooseItem,
  updateWhyChooseItem,
  deleteWhyChooseItem,
  reorderWhyChooseItems,
  reorderPageBlocks,
  reorderPageSections,
  updateCustomPage,
  updatePageBlock,
  updatePageSection,
} from "../services/pageBuilderService";

function validateKey(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateRoute(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().startsWith("/");
}

export async function adminListCustomPages(req: Request, res: Response) {
  try {
    const pages = await getAllCustomPages();
    return res.json({ pages });
  } catch (error) {
    console.error("[page-builder] Impossible de lister les pages", error);
    return res
      .status(500)
      .json({ message: "Impossible de récupérer les pages personnalisées." });
  }
}

export async function adminGetCustomPage(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const page = await getCustomPageWithStructureById(id);
    if (!page) {
      return res.status(404).json({ message: "Page introuvable." });
    }

    return res.json({ page });
  } catch (error) {
    console.error("[page-builder] Impossible de récupérer la page", error);
    return res
      .status(500)
      .json({ message: "Impossible de récupérer cette page." });
  }
}

export async function adminCreateCustomPage(req: Request, res: Response) {
  const { key, route, name, status } = req.body ?? {};

  if (!validateKey(key)) {
    return res.status(400).json({ message: "La clé est obligatoire." });
  }

  if (!validateRoute(route)) {
    return res
      .status(400)
      .json({ message: "La route est obligatoire et doit commencer par /." });
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ message: "Le nom de la page est obligatoire." });
  }

  try {
    const page = await createCustomPage({ key, route, name, status });
    return res.status(201).json({ page });
  } catch (error: any) {
    console.error("[page-builder] Impossible de créer la page", error);
    return res.status(400).json({ message: error?.message || "Création impossible." });
  }
}

export async function adminUpdateCustomPage(req: Request, res: Response) {
  const { id } = req.params;
  const { route, name, status } = req.body ?? {};

  if (route && !validateRoute(route)) {
    return res
      .status(400)
      .json({ message: "La route doit commencer par /." });
  }

  try {
    const updated = await updateCustomPage(id, { route, name, status });
    if (!updated) {
      return res.status(404).json({ message: "Page introuvable." });
    }

    return res.json({ page: updated });
  } catch (error: any) {
    console.error("[page-builder] Impossible de mettre à jour la page", error);
    return res.status(400).json({ message: error?.message || "Mise à jour impossible." });
  }
}

export async function adminDeleteCustomPage(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const deleted = await deleteCustomPage(id);
    if (!deleted) {
      return res.status(404).json({ message: "Page introuvable." });
    }

    return res.json({ message: "Page supprimée.", page: deleted });
  } catch (error) {
    console.error("[page-builder] Impossible de supprimer la page", error);
    return res.status(500).json({ message: "Suppression impossible." });
  }
}

export async function adminCreatePageSection(req: Request, res: Response) {
  const { pageId } = req.params;
  const { label, type, backgroundColor, backgroundImageUrl, settings } = req.body ?? {};

  if (!type || typeof type !== "string") {
    return res.status(400).json({ message: "Le type de section est obligatoire." });
  }

  try {
    const section = await createPageSection(pageId, {
      label,
      type,
      backgroundColor,
      backgroundImageUrl,
      settings,
    });

    return res.status(201).json({ section });
  } catch (error: any) {
    console.error("[page-builder] Impossible de créer la section", error);
    return res.status(400).json({ message: error?.message || "Création impossible." });
  }
}

export async function adminUpdatePageSection(req: Request, res: Response) {
  const { sectionId } = req.params;
  const { label, type, backgroundColor, backgroundImageUrl, settings } = req.body ?? {};

  try {
    const section = await updatePageSection(sectionId, {
      label,
      type,
      backgroundColor,
      backgroundImageUrl,
      settings,
    });

    if (!section) {
      return res.status(404).json({ message: "Section introuvable." });
    }

    return res.json({ section });
  } catch (error) {
    console.error("[page-builder] Impossible de mettre à jour la section", error);
    return res.status(400).json({ message: "Mise à jour impossible." });
  }
}

export async function adminDeletePageSection(req: Request, res: Response) {
  const { sectionId } = req.params;

  try {
    const section = await deletePageSection(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section introuvable." });
    }

    return res.json({ message: "Section supprimée", section });
  } catch (error) {
    console.error("[page-builder] Impossible de supprimer la section", error);
    return res.status(500).json({ message: "Suppression impossible." });
  }
}

export async function adminReorderPageSections(req: Request, res: Response) {
  const { pageId } = req.params;
  const { sectionIds } = req.body ?? {};

  if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
    return res.status(400).json({ message: "Le nouvel ordre est invalide." });
  }

  try {
    await reorderPageSections(pageId, sectionIds);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("[page-builder] Impossible de réordonner les sections", error);
    return res.status(400).json({ message: error?.message || "Réordonnancement impossible." });
  }
}

export async function adminCreatePageBlock(req: Request, res: Response) {
  const { sectionId } = req.params;
  const { type, data, order } = req.body ?? {};

  if (!type || typeof type !== "string") {
    return res.status(400).json({ message: "Le type de bloc est obligatoire." });
  }

  try {
    const block = await createPageBlock(sectionId, { type, data, order });
    return res.status(201).json({ block });
  } catch (error: any) {
    console.error("[page-builder] Impossible de créer le bloc", error);
    return res.status(400).json({ message: error?.message || "Création impossible." });
  }
}

export async function adminUpdatePageBlock(req: Request, res: Response) {
  const { blockId } = req.params;
  const { type, data } = req.body ?? {};

  try {
    const block = await updatePageBlock(blockId, { type, data });
    if (!block) {
      return res.status(404).json({ message: "Bloc introuvable." });
    }

    return res.json({ block });
  } catch (error) {
    console.error("[page-builder] Impossible de mettre à jour le bloc", error);
    return res.status(400).json({ message: "Mise à jour impossible." });
  }
}

export async function adminDeletePageBlock(req: Request, res: Response) {
  const { blockId } = req.params;

  try {
    const block = await deletePageBlock(blockId);
    if (!block) {
      return res.status(404).json({ message: "Bloc introuvable." });
    }

    return res.json({ message: "Bloc supprimé", block });
  } catch (error) {
    console.error("[page-builder] Impossible de supprimer le bloc", error);
    return res.status(500).json({ message: "Suppression impossible." });
  }
}

export async function adminReorderPageBlocks(req: Request, res: Response) {
  const { sectionId } = req.params;
  const { blockIds } = req.body ?? {};

  if (!Array.isArray(blockIds) || blockIds.length === 0) {
    return res.status(400).json({ message: "Le nouvel ordre est invalide." });
  }

  try {
    await reorderPageBlocks(sectionId, blockIds);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("[page-builder] Impossible de réordonner les blocs", error);
    return res.status(400).json({ message: error?.message || "Réordonnancement impossible." });
  }
}

export async function adminCreateWhyChooseItem(req: Request, res: Response) {
  const { sectionId } = req.params;
  const { iconType, title, description, order } = req.body ?? {};

  try {
    const item = await createWhyChooseItem(sectionId, {
      iconType,
      title,
      description,
      order,
    });

    return res.status(201).json({ item });
  } catch (error: any) {
    console.error("[page-builder] Impossible de créer l'élément Pourquoi choisir", error);
    return res
      .status(400)
      .json({ message: error?.message || "Création de l'élément impossible." });
  }
}

export async function adminUpdateWhyChooseItem(req: Request, res: Response) {
  const { itemId } = req.params;
  const { iconType, title, description } = req.body ?? {};

  try {
    const item = await updateWhyChooseItem(itemId, { iconType, title, description });

    if (!item) {
      return res.status(404).json({ message: "Élément introuvable." });
    }

    return res.json({ item });
  } catch (error: any) {
    console.error("[page-builder] Impossible de mettre à jour l'élément Pourquoi choisir", error);
    return res
      .status(400)
      .json({ message: error?.message || "Mise à jour de l'élément impossible." });
  }
}

export async function adminDeleteWhyChooseItem(req: Request, res: Response) {
  const { itemId } = req.params;

  try {
    const item = await deleteWhyChooseItem(itemId);

    if (!item) {
      return res.status(404).json({ message: "Élément introuvable." });
    }

    return res.json({ message: "Élément supprimé", item });
  } catch (error) {
    console.error("[page-builder] Impossible de supprimer l'élément Pourquoi choisir", error);
    return res.status(500).json({ message: "Suppression impossible." });
  }
}

export async function adminReorderWhyChooseItems(req: Request, res: Response) {
  const { sectionId } = req.params;
  const { itemIds } = req.body ?? {};

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ message: "Le nouvel ordre est invalide." });
  }

  try {
    await reorderWhyChooseItems(sectionId, itemIds);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("[page-builder] Impossible de réordonner les éléments Pourquoi choisir", error);
    return res
      .status(400)
      .json({ message: error?.message || "Réordonnancement impossible." });
  }
}

export async function publicGetCustomPageByRoute(req: Request, res: Response) {
  const { route } = req.query as { route?: string };

  if (!route || typeof route !== "string") {
    return res.status(400).json({ message: "La route est obligatoire." });
  }

  if (!route.trim().startsWith("/")) {
    return res.status(400).json({ message: "La route doit commencer par /." });
  }

  try {
    const page = await getPublishedCustomPageByRoute(route);

    if (!page) {
      return res.status(404).json({ message: "Page introuvable." });
    }

    return res.json({
      page: {
        id: page.id,
        key: page.key,
        name: page.name,
        route: page.route,
        status: page.status,
      },
      sections: page.sections ?? [],
    });
  } catch (error) {
    console.error("[page-builder] Impossible de charger la page publique", error);
    return res.status(500).json({ message: "Impossible de charger cette page." });
  }
}
