import { Request, Response } from "express";
import {
  getEmailTemplateById,
  listEmailTemplates,
  updateEmailTemplate,
} from "../services/emailTemplateService";
import { listPlaceholdersForKey } from "../services/transactionalEmailService";

export async function adminListEmailTemplates(_req: Request, res: Response) {
  try {
    const templates = await listEmailTemplates();
    return res.json({
      templates: templates.map((tpl) => ({
        id: tpl.id,
        key: tpl.key,
        name: tpl.name,
        description: tpl.description,
        isActive: tpl.isActive,
      })),
    });
  } catch (error) {
    console.error("Erreur liste templates email", error);
    return res
      .status(500)
      .json({ message: "Impossible de récupérer les templates." });
  }
}

export async function adminGetEmailTemplate(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const template = await getEmailTemplateById(id);
    if (!template) {
      return res.status(404).json({ message: "Template introuvable." });
    }

    return res.json({
      template: {
        ...template,
        placeholders: listPlaceholdersForKey(template.key),
      },
    });
  } catch (error) {
    console.error("Erreur récupération template email", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger le template." });
  }
}

export async function adminUpdateEmailTemplate(req: Request, res: Response) {
  const { id } = req.params;
  const payload = req.body || {};

  try {
    const updated = await updateEmailTemplate(id, payload);
    return res.json({
      template: {
        ...updated,
        placeholders: listPlaceholdersForKey(updated.key),
      },
      message: "Template mis à jour.",
    });
  } catch (error) {
    console.error("Erreur mise à jour template email", error);
    return res
      .status(500)
      .json({ message: "Impossible de mettre à jour le template." });
  }
}
