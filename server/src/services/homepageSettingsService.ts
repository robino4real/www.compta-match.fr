import { HomepageSettings, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export type HomepageFeature = { title: string; description: string };
export type HomepageTestimonial = { name: string; role: string; text: string };

const DEFAULT_HOME_SETTINGS: Omit<HomepageSettings, "id" | "createdAt" | "updatedAt"> = {
  heroTitle: "Bienvenue chez ComptaMatch",
  heroSubtitle:
    "Outils et contenus pour simplifier la comptabilité des TPE, indépendants et micro-entrepreneurs.",
  heroButtonLabel: "Découvrir nos offres",
  heroButtonUrl: "/offres",
  heroImageUrl: null,
  heroBackgroundImageUrl: null,
  navbarLogoUrl: null,
  faviconUrl: null,
  features: [
    {
      title: "Gain de temps",
      description: "Un tableau de bord clair pour suivre vos obligations et vos documents.",
    },
    {
      title: "Sérénité",
      description: "Nous centralisons vos achats téléchargeables et vos preuves d'achat.",
    },
    {
      title: "Souplesse",
      description: "Des logiciels à télécharger ou un suivi en ligne selon vos préférences.",
    },
  ] as Prisma.JsonValue,
  highlightedProductIds: [] as Prisma.JsonValue,
  testimonials: [
    {
      name: "Claire, micro-entrepreneuse",
      role: "Consultante",
      text: "ComptaMatch m'aide à garder le cap sur mes justificatifs et mes factures sans y passer des heures.",
    },
  ] as Prisma.JsonValue,
  contentBlockTitle: "Une approche pragmatique",
  contentBlockBody:
    "ComptaMatch privilégie des interfaces sobres, des guides clairs et des téléchargements fiables pour vos outils comptables.",
  seoTitle: "ComptaMatch | Solutions comptables pour TPE et indépendants",
  seoDescription:
    "Logiciels téléchargeables et ressources en ligne pour simplifier la comptabilité des petites entreprises.",
};

function sanitizeString(value: unknown): string | null | undefined {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null) return null;
  return undefined;
}

function normalizeArray<T>(value: unknown, mapper: (item: any) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const mapped = value
    .map(mapper)
    .filter((it): it is T => Boolean(it));
  return mapped;
}

export async function getOrCreateHomepageSettings(): Promise<HomepageSettings> {
  const existing = await prisma.homepageSettings.findFirst();
  if (existing) return existing;

  return prisma.homepageSettings.create({
    data: {
      id: 1,
      heroTitle: DEFAULT_HOME_SETTINGS.heroTitle,
      heroSubtitle: DEFAULT_HOME_SETTINGS.heroSubtitle,
      heroButtonLabel: DEFAULT_HOME_SETTINGS.heroButtonLabel,
      heroButtonUrl: DEFAULT_HOME_SETTINGS.heroButtonUrl,
      heroImageUrl: DEFAULT_HOME_SETTINGS.heroImageUrl,
      heroBackgroundImageUrl: DEFAULT_HOME_SETTINGS.heroBackgroundImageUrl,
      navbarLogoUrl: DEFAULT_HOME_SETTINGS.navbarLogoUrl,
      faviconUrl: DEFAULT_HOME_SETTINGS.faviconUrl,
      features: DEFAULT_HOME_SETTINGS.features as Prisma.InputJsonValue,
      highlightedProductIds:
        DEFAULT_HOME_SETTINGS.highlightedProductIds as Prisma.InputJsonValue,
      testimonials: DEFAULT_HOME_SETTINGS.testimonials as Prisma.InputJsonValue,
      contentBlockTitle: DEFAULT_HOME_SETTINGS.contentBlockTitle,
      contentBlockBody: DEFAULT_HOME_SETTINGS.contentBlockBody,
      seoTitle: DEFAULT_HOME_SETTINGS.seoTitle,
      seoDescription: DEFAULT_HOME_SETTINGS.seoDescription,
    },
  });
}

export async function updateHomepageSettings(
  payload: Partial<HomepageSettings> & {
    features?: HomepageFeature[] | unknown;
    highlightedProductIds?: string[] | unknown;
    testimonials?: HomepageTestimonial[] | unknown;
  }
): Promise<HomepageSettings> {
  const existing = await prisma.homepageSettings.findFirst();

  const safeFeatures =
    normalizeArray<HomepageFeature>(payload.features, (item) => {
      const title = sanitizeString(item?.title);
      const description = sanitizeString(item?.description);
      if (!title && !description) return null;
      return {
        title: title || "",
        description: description || "",
      };
    }) ?? (existing?.features as HomepageFeature[] | null) ?? [];

  const safeTestimonials =
    normalizeArray<HomepageTestimonial>(payload.testimonials, (item) => {
      const name = sanitizeString(item?.name);
      const role = sanitizeString(item?.role);
      const text = sanitizeString(item?.text);
      if (!name && !role && !text) return null;
      return {
        name: name || "",
        role: role || "",
        text: text || "",
      };
    }) ?? (existing?.testimonials as HomepageTestimonial[] | null) ?? [];

  const safeHighlightedIds =
    normalizeArray<string>(payload.highlightedProductIds, (item) => {
      if (item == null) return null;
      return String(item);
    }) ?? (existing?.highlightedProductIds as string[] | null) ?? [];

  const data = {
    heroTitle: sanitizeString(payload.heroTitle) ?? existing?.heroTitle ?? DEFAULT_HOME_SETTINGS.heroTitle,
    heroSubtitle:
      sanitizeString(payload.heroSubtitle) ?? existing?.heroSubtitle ?? DEFAULT_HOME_SETTINGS.heroSubtitle,
    heroButtonLabel:
      sanitizeString(payload.heroButtonLabel) ?? existing?.heroButtonLabel ?? DEFAULT_HOME_SETTINGS.heroButtonLabel,
    heroButtonUrl:
      sanitizeString(payload.heroButtonUrl) ?? existing?.heroButtonUrl ?? DEFAULT_HOME_SETTINGS.heroButtonUrl,
    heroImageUrl: sanitizeString(payload.heroImageUrl) ?? null,
    heroBackgroundImageUrl: sanitizeString(payload.heroBackgroundImageUrl) ?? null,
    navbarLogoUrl: sanitizeString(payload.navbarLogoUrl) ?? null,
    faviconUrl: sanitizeString(payload.faviconUrl) ?? null,
    features: safeFeatures,
    highlightedProductIds: safeHighlightedIds,
    testimonials: safeTestimonials,
    contentBlockTitle:
      sanitizeString(payload.contentBlockTitle) ?? existing?.contentBlockTitle ?? DEFAULT_HOME_SETTINGS.contentBlockTitle,
    contentBlockBody:
      sanitizeString(payload.contentBlockBody) ?? existing?.contentBlockBody ?? DEFAULT_HOME_SETTINGS.contentBlockBody,
    seoTitle: sanitizeString(payload.seoTitle) ?? existing?.seoTitle ?? DEFAULT_HOME_SETTINGS.seoTitle,
    seoDescription:
      sanitizeString(payload.seoDescription) ??
      existing?.seoDescription ??
      DEFAULT_HOME_SETTINGS.seoDescription,
  };

  if (!existing) {
    return prisma.homepageSettings.create({
      data: {
        id: 1,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroButtonLabel: data.heroButtonLabel,
        heroButtonUrl: data.heroButtonUrl,
        heroImageUrl: data.heroImageUrl,
        heroBackgroundImageUrl: data.heroBackgroundImageUrl,
        navbarLogoUrl: data.navbarLogoUrl,
        faviconUrl: data.faviconUrl,
        features: data.features as Prisma.InputJsonValue,
        highlightedProductIds: data.highlightedProductIds as Prisma.InputJsonValue,
        testimonials: data.testimonials as Prisma.InputJsonValue,
        contentBlockTitle: data.contentBlockTitle ?? null,
        contentBlockBody: data.contentBlockBody ?? null,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
      },
    });
  }

  return prisma.homepageSettings.update({
    where: { id: existing.id },
    data: {
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      heroButtonLabel: data.heroButtonLabel,
      heroButtonUrl: data.heroButtonUrl,
      heroImageUrl: data.heroImageUrl,
      heroBackgroundImageUrl: data.heroBackgroundImageUrl,
      navbarLogoUrl: data.navbarLogoUrl,
      faviconUrl: data.faviconUrl,
      features: data.features as Prisma.InputJsonValue,
      highlightedProductIds: data.highlightedProductIds as Prisma.InputJsonValue,
      testimonials: data.testimonials as Prisma.InputJsonValue,
      contentBlockTitle: data.contentBlockTitle ?? null,
      contentBlockBody: data.contentBlockBody ?? null,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
    },
  });
}

