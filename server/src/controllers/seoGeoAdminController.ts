import { Request, Response } from "express";
import {
  ValidationError,
  createGeoAnswer,
  createGeoFaqItem,
  deleteGeoAnswer,
  deleteGeoFaqItem,
  getGeoIdentitySingleton,
  getPageSeoByPageId,
  getProductSeoByProductId,
  getSeoSettingsSingleton,
  listGeoAnswers,
  listGeoFaqItems,
  reorderGeoAnswers,
  reorderGeoFaqItems,
  runSeoGeoDiagnostics,
  savePageSeo,
  saveProductSeo,
  updateGeoAnswer,
  updateGeoFaqItem,
  updateGeoIdentitySingleton,
  updateSeoSettingsSingleton,
} from "../services/seoGeoAdminService";
import { HttpError } from "../utils/errors";

function handleError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof ValidationError) {
    return res
      .status(error.status)
      .json({ ok: false, error: { message: error.message, code: error.code } });
  }

  if (error instanceof HttpError) {
    return res
      .status(error.statusCode)
      .json({ ok: false, error: { message: error.message, code: error.code } });
  }

  console.error(fallbackMessage, error);
  return res
    .status(500)
    .json({ ok: false, error: { message: fallbackMessage, code: "SERVER_ERROR" } });
}

export async function adminGetSeoSettingsV2(_req: Request, res: Response) {
  try {
    const settings = await getSeoSettingsSingleton();
    return res.json({ ok: true, data: settings });
  } catch (error) {
    return handleError(res, error, "Impossible de charger les paramètres SEO");
  }
}

export async function adminUpdateSeoSettingsV2(req: Request, res: Response) {
  try {
    const settings = await updateSeoSettingsSingleton(req.body || {});
    return res.json({ ok: true, data: settings, message: "Paramètres SEO enregistrés" });
  } catch (error) {
    return handleError(res, error, "Impossible d'enregistrer les paramètres SEO");
  }
}

export async function adminGetGeoIdentity(_req: Request, res: Response) {
  try {
    const identity = await getGeoIdentitySingleton();
    return res.json({ ok: true, data: identity });
  } catch (error) {
    return handleError(res, error, "Impossible de charger l'identité GEO");
  }
}

export async function adminUpdateGeoIdentity(req: Request, res: Response) {
  try {
    const identity = await updateGeoIdentitySingleton(req.body || {});
    return res.json({ ok: true, data: identity, message: "Identité GEO enregistrée" });
  } catch (error) {
    return handleError(res, error, "Impossible d'enregistrer l'identité GEO");
  }
}

export async function adminListGeoFaq(_req: Request, res: Response) {
  try {
    const items = await listGeoFaqItems();
    return res.json({ ok: true, data: items });
  } catch (error) {
    return handleError(res, error, "Impossible de lister la FAQ GEO");
  }
}

export async function adminCreateGeoFaq(req: Request, res: Response) {
  try {
    const item = await createGeoFaqItem(req.body || {});
    return res.status(201).json({ ok: true, data: item, message: "FAQ créée" });
  } catch (error) {
    return handleError(res, error, "Impossible de créer la FAQ GEO");
  }
}

export async function adminUpdateGeoFaq(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const item = await updateGeoFaqItem(id, req.body || {});
    return res.json({ ok: true, data: item, message: "FAQ mise à jour" });
  } catch (error) {
    return handleError(res, error, "Impossible de mettre à jour la FAQ GEO");
  }
}

export async function adminDeleteGeoFaq(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteGeoFaqItem(id);
    return res.json({ ok: true, message: "FAQ supprimée" });
  } catch (error) {
    return handleError(res, error, "Impossible de supprimer la FAQ GEO");
  }
}

export async function adminReorderGeoFaq(req: Request, res: Response) {
  try {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    const items = await reorderGeoFaqItems(ids);
    return res.json({ ok: true, data: items, message: "FAQ réordonnée" });
  } catch (error) {
    return handleError(res, error, "Impossible de réordonner la FAQ GEO");
  }
}

export async function adminListGeoAnswers(_req: Request, res: Response) {
  try {
    const answers = await listGeoAnswers();
    return res.json({ ok: true, data: answers });
  } catch (error) {
    return handleError(res, error, "Impossible de lister les réponses GEO");
  }
}

export async function adminCreateGeoAnswer(req: Request, res: Response) {
  try {
    const answer = await createGeoAnswer(req.body || {});
    return res.status(201).json({ ok: true, data: answer, message: "Réponse créée" });
  } catch (error) {
    return handleError(res, error, "Impossible de créer la réponse GEO");
  }
}

export async function adminUpdateGeoAnswer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const answer = await updateGeoAnswer(id, req.body || {});
    return res.json({ ok: true, data: answer, message: "Réponse mise à jour" });
  } catch (error) {
    return handleError(res, error, "Impossible de mettre à jour la réponse GEO");
  }
}

export async function adminDeleteGeoAnswer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteGeoAnswer(id);
    return res.json({ ok: true, message: "Réponse supprimée" });
  } catch (error) {
    return handleError(res, error, "Impossible de supprimer la réponse GEO");
  }
}

export async function adminReorderGeoAnswers(req: Request, res: Response) {
  try {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    const answers = await reorderGeoAnswers(ids);
    return res.json({ ok: true, data: answers, message: "Réponses réordonnées" });
  } catch (error) {
    return handleError(res, error, "Impossible de réordonner les réponses GEO");
  }
}

export async function adminRunSeoGeoDiagnostics(_req: Request, res: Response) {
  try {
    const result = await runSeoGeoDiagnostics();
    return res.json({ ok: true, data: result });
  } catch (error) {
    return handleError(res, error, "Impossible d'exécuter les diagnostics");
  }
}

export async function adminGetPageSeo(req: Request, res: Response) {
  try {
    const { pageId } = req.params;
    const pageSeo = await getPageSeoByPageId(pageId);
    return res.json({ ok: true, data: pageSeo });
  } catch (error) {
    return handleError(res, error, "Impossible de charger le SEO de page");
  }
}

export async function adminSavePageSeo(req: Request, res: Response) {
  try {
    const { pageId } = req.params;
    const pageSeo = await savePageSeo(pageId, req.body || {});
    return res.json({ ok: true, data: pageSeo, message: "SEO de page enregistré" });
  } catch (error) {
    return handleError(res, error, "Impossible d'enregistrer le SEO de page");
  }
}

export async function adminGetProductSeo(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const seo = await getProductSeoByProductId(productId);
    return res.json({ ok: true, data: seo });
  } catch (error) {
    return handleError(res, error, "Impossible de charger le SEO produit");
  }
}

export async function adminSaveProductSeo(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const seo = await saveProductSeo(productId, req.body || {});
    return res.json({ ok: true, data: seo, message: "SEO produit enregistré" });
  } catch (error) {
    return handleError(res, error, "Impossible d'enregistrer le SEO produit");
  }
}
