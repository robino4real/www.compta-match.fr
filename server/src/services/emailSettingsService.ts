import { EmailSettings } from "@prisma/client";
import { prisma } from "../config/prisma";

const DEFAULT_SETTINGS: Omit<
  EmailSettings,
  "id" | "createdAt" | "updatedAt"
> = {
  providerType: "OTHER",
  fromNameDefault: "ComptaMatch",
  fromEmailDefault: "no-reply@comptamatch.fr",
  replyToEmailDefault: null,
  ordersFromEmail: null,
  billingEmail: null,
  supportEmail: null,
  technicalContactEmail: null,
  smtpHost: null,
  smtpPort: null,
  smtpUsername: null,
  smtpPassword: null,
  apiKey: null,
};

export function redactEmailSettings(
  settings: EmailSettings
): Omit<EmailSettings, "smtpPassword" | "apiKey"> & {
  smtpPasswordSet: boolean;
  apiKeySet: boolean;
} {
  const { smtpPassword, apiKey, ...rest } = settings;
  return {
    ...rest,
    smtpPasswordSet: Boolean(smtpPassword),
    apiKeySet: Boolean(apiKey),
  };
}

export async function getEmailSettings(): Promise<EmailSettings | null> {
  return prisma.emailSettings.findFirst();
}

export async function getOrCreateEmailSettings(): Promise<EmailSettings> {
  const existing = await prisma.emailSettings.findFirst();
  if (existing) return existing;

  return prisma.emailSettings.create({
    data: {
      id: 1,
      ...DEFAULT_SETTINGS,
    },
  });
}

export async function upsertEmailSettings(
  payload: Partial<EmailSettings>
): Promise<EmailSettings> {
  const existing = await getOrCreateEmailSettings();

  const data: Partial<EmailSettings> = { ...payload };

  if (payload.smtpPort !== undefined) {
    data.smtpPort = payload.smtpPort ? Number(payload.smtpPort) : null;
  }

  if (payload.smtpPassword === undefined || payload.smtpPassword === "") {
    delete data.smtpPassword;
  } else if (payload.smtpPassword === null) {
    data.smtpPassword = null;
  }

  if (payload.apiKey === undefined || payload.apiKey === "") {
    delete data.apiKey;
  } else if (payload.apiKey === null) {
    data.apiKey = null;
  }

  delete (data as any).id;
  delete (data as any).createdAt;
  delete (data as any).updatedAt;

  return prisma.emailSettings.update({
    where: { id: existing.id },
    data,
  });
}
