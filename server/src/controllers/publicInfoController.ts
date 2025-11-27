import { Request, Response } from "express";
import { getOrCreateCompanySettings } from "../services/companySettingsService";
import { getOrCreateEmailSettings } from "../services/emailSettingsService";

export async function getPublicContactInfo(_req: Request, res: Response) {
  const companySettings = await getOrCreateCompanySettings();
  const emailSettings = await getOrCreateEmailSettings();

  const contactEmail =
    companySettings.contactEmail ||
    companySettings.supportEmail ||
    emailSettings.supportEmail ||
    emailSettings.replyToEmailDefault ||
    emailSettings.fromEmailDefault;

  const supportEmail =
    companySettings.supportEmail ||
    emailSettings.supportEmail ||
    companySettings.contactEmail ||
    emailSettings.replyToEmailDefault;

  return res.json({
    contactEmail,
    supportEmail,
  });
}
