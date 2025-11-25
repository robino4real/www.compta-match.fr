import { Request, Response } from "express";
import {
  getOrCreateEmailSettings,
  redactEmailSettings,
  upsertEmailSettings,
} from "../services/emailSettingsService";

export async function getEmailSettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateEmailSettings();
    return res.json({ settings: redactEmailSettings(settings) });
  } catch (error) {
    console.error("Erreur chargement paramètres email", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les paramètres email." });
  }
}

export async function saveEmailSettings(req: Request, res: Response) {
  try {
    const payload = req.body || {};
    const settings = await upsertEmailSettings(payload);
    return res.json({
      settings: redactEmailSettings(settings),
      message: "Paramètres email enregistrés.",
    });
  } catch (error) {
    console.error("Erreur sauvegarde paramètres email", error);
    return res
      .status(500)
      .json({ message: "Impossible d'enregistrer les paramètres email." });
  }
}
