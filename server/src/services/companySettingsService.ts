import { CompanySettings, VatRegime } from "@prisma/client";
import { prisma } from "../config/prisma";

const DEFAULT_SETTINGS: Omit<CompanySettings, "id" | "createdAt" | "updatedAt"> = {
  companyName: "ComptaMatch",
  legalForm: "SASU",
  tradeName: null,
  addressLine1: "Adresse à configurer",
  addressLine2: null,
  postalCode: "00000",
  city: "Ville",
  country: "France",
  siren: null,
  siret: null,
  rcsCity: null,
  vatNumber: null,
  vatRegime: VatRegime.NO_VAT_293B,
  vatCustomMention: null,
  capital: null,
  contactEmail: "contact@compta-match.fr",
  supportEmail: "contact@compta-match.fr",
  websiteUrl: "https://www.compta-match.fr",
  invoiceFooterText: null,
  logoUrl: null,
};

export async function getOrCreateCompanySettings(): Promise<CompanySettings> {
  const settings = await prisma.companySettings.findFirst();
  if (settings) return settings;

  return prisma.companySettings.create({
    data: {
      id: 1,
      ...DEFAULT_SETTINGS,
    },
  });
}

export async function updateCompanySettings(
  payload: Partial<CompanySettings>
): Promise<CompanySettings> {
  const existing = await prisma.companySettings.findFirst();

  if (!existing) {
    return prisma.companySettings.create({
      data: {
        id: 1,
        ...DEFAULT_SETTINGS,
        ...payload,
      },
    });
  }

  return prisma.companySettings.update({
    where: { id: existing.id },
    data: payload,
  });
}

export function buildVatMention(settings: CompanySettings): string | null {
  if (settings.vatRegime === "NO_VAT_293B") {
    return (
      settings.vatCustomMention || "TVA non applicable, article 293 B du CGI"
    );
  }

  if (settings.vatRegime === "OTHER") {
    return settings.vatCustomMention || null;
  }

  return null;
}

export function buildSellerAddress(settings: CompanySettings): string {
  const parts = [settings.addressLine1, settings.addressLine2]
    .filter(Boolean)
    .join("\n");
  return parts || settings.addressLine1;
}
