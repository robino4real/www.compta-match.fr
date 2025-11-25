import { LegalPage } from "@prisma/client";
import { prisma } from "../config/prisma";

export type LegalPageKey =
  | "MENTIONS_LEGALES"
  | "CGV"
  | "CONFIDENTIALITE"
  | "COOKIES";

const DEFAULT_PAGES: Record<LegalPageKey, Omit<LegalPage, "id" | "createdAt" | "updatedAt">> = {
  MENTIONS_LEGALES: {
    key: "MENTIONS_LEGALES",
    title: "Mentions légales",
    slug: "mentions-legales",
    content:
      "<p>Les informations légales de ComptaMatch seront publiées ici. Utilisez le back-office pour compléter le contenu.</p>",
    isPublished: false,
  },
  CGV: {
    key: "CGV",
    title: "Conditions Générales de Vente",
    slug: "cgv",
    content:
      "<p>Les conditions générales de vente sont en cours de rédaction. Mettez à jour cette page depuis l'administration.</p>",
    isPublished: false,
  },
  CONFIDENTIALITE: {
    key: "CONFIDENTIALITE",
    title: "Politique de confidentialité",
    slug: "confidentialite",
    content:
      "<p>La politique de confidentialité sera détaillée ici. Vous pouvez renseigner le contenu via le back-office.</p>",
    isPublished: false,
  },
  COOKIES: {
    key: "COOKIES",
    title: "Politique de cookies",
    slug: "cookies",
    content:
      "<p>La politique de cookies de ComptaMatch sera affichée ici lorsqu'elle sera prête.</p>",
    isPublished: false,
  },
};

function sanitizeUpdatePayload(payload: Partial<LegalPage>): Partial<LegalPage> {
  const data = { ...payload } as Partial<LegalPage>;
  delete (data as any).id;
  delete (data as any).createdAt;
  delete (data as any).updatedAt;
  delete (data as any).key;
  return data;
}

export async function ensureDefaultLegalPages(): Promise<void> {
  for (const definition of Object.values(DEFAULT_PAGES)) {
    const existing = await prisma.legalPage.findUnique({ where: { key: definition.key } });
    if (!existing) {
      await prisma.legalPage.create({ data: definition });
    }
  }
}

export async function createMissingLegalPages(): Promise<LegalPage[]> {
  const created: LegalPage[] = [];
  for (const definition of Object.values(DEFAULT_PAGES)) {
    const existing = await prisma.legalPage.findUnique({ where: { key: definition.key } });
    if (!existing) {
      const page = await prisma.legalPage.create({ data: definition });
      created.push(page);
    }
  }
  return created;
}

export async function listLegalPages(): Promise<LegalPage[]> {
  await ensureDefaultLegalPages();
  return prisma.legalPage.findMany({ orderBy: { key: "asc" } });
}

export async function getLegalPageById(id: string): Promise<LegalPage | null> {
  await ensureDefaultLegalPages();
  return prisma.legalPage.findUnique({ where: { id } });
}

export async function updateLegalPage(
  id: string,
  payload: Partial<LegalPage>
): Promise<LegalPage> {
  await ensureDefaultLegalPages();
  const data = sanitizeUpdatePayload(payload);
  return prisma.legalPage.update({
    where: { id },
    data,
  });
}

export async function getPublishedLegalPage(
  identifier: string
): Promise<LegalPage | null> {
  await ensureDefaultLegalPages();
  const normalizedKey = identifier.toUpperCase() as LegalPageKey;
  return prisma.legalPage.findFirst({
    where: {
      isPublished: true,
      OR: [
        { key: normalizedKey as string },
        { slug: identifier },
      ],
    },
  });
}
