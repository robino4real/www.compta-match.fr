import { Request, Response } from "express";
import { getOrCreateCompanySettings, updateCompanySettings } from "../services/companySettingsService";

export async function getCompanySettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateCompanySettings();
    return res.json({ settings });
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres entreprise", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les paramètres d'entreprise." });
  }
}

export async function saveCompanySettings(req: Request, res: Response) {
  try {
    const payload = req.body || {};
    const settings = await updateCompanySettings(payload);
    return res.json({ settings, message: "Paramètres enregistrés" });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des paramètres entreprise", error);
    return res
      .status(500)
      .json({ message: "Impossible d'enregistrer les paramètres." });
  }
}
