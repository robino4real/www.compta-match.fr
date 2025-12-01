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
  heroPrimaryCtaLabel: "Découvrir nos logiciels",
  heroPrimaryCtaHref: "/telechargements",
  heroIllustrationUrl:
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
  heroImageUrl: null,
  heroBackgroundImageUrl: null,
  siteLogoUrl: null,
  navbarLogoUrl: null,
  faviconUrl: null,
  logoText: "ComptaMatch",
  logoSquareText: "CM",
  navLinks: [
    { label: "Comparer les offres", href: "/offres" },
    { label: "Nos logiciels", href: "/telechargements" },
    { label: "Contact", href: "/contact" },
  ] as Prisma.JsonValue,
  primaryNavButton: { label: "S'identifier", href: "/auth/login" },
  featureCards: [
    {
      iconKey: "apps",
      title: "Outils simples & complets",
      description: "Des logiciels clairs pour piloter votre comptabilité sans jargon.",
    },
    {
      iconKey: "pricing",
      title: "Tarifs transparents",
      description: "Comparez et choisissez l'offre la plus adaptée à votre activité.",
    },
    {
      iconKey: "support",
      title: "Accompagnement dédié",
      description: "Guides et support réactif pour avancer sereinement.",
    },
  ] as Prisma.JsonValue,
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
      heroPrimaryCtaLabel: DEFAULT_HOME_SETTINGS.heroPrimaryCtaLabel,
      heroPrimaryCtaHref: DEFAULT_HOME_SETTINGS.heroPrimaryCtaHref,
      heroIllustrationUrl: DEFAULT_HOME_SETTINGS.heroIllustrationUrl,
      heroImageUrl: DEFAULT_HOME_SETTINGS.heroImageUrl,
      heroBackgroundImageUrl: DEFAULT_HOME_SETTINGS.heroBackgroundImageUrl,
      siteLogoUrl: DEFAULT_HOME_SETTINGS.siteLogoUrl,
      navbarLogoUrl: DEFAULT_HOME_SETTINGS.navbarLogoUrl,
      faviconUrl: DEFAULT_HOME_SETTINGS.faviconUrl,
      logoText: DEFAULT_HOME_SETTINGS.logoText,
      logoSquareText: DEFAULT_HOME_SETTINGS.logoSquareText,
      navLinks: DEFAULT_HOME_SETTINGS.navLinks as Prisma.InputJsonValue,
      primaryNavButton: DEFAULT_HOME_SETTINGS.primaryNavButton as Prisma.InputJsonValue,
      featureCards: DEFAULT_HOME_SETTINGS.featureCards as Prisma.InputJsonValue,
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
    navLinks?: { label?: string; href?: string }[] | unknown;
    primaryNavButton?: { label?: string; href?: string } | unknown;
    featureCards?: { iconKey?: string; title?: string; description?: string }[] | unknown;
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

  const safeNavLinks =
    normalizeArray<{ label: string; href: string }>(payload.navLinks, (item) => {
      const label = sanitizeString(item?.label);
      const href = sanitizeString(item?.href);
      if (!label || !href) return null;
      return { label, href };
    }) ?? (existing?.navLinks as { label: string; href: string }[] | null) ?? [];

  const safePrimaryButton = (() => {
    const incoming = payload.primaryNavButton as { label?: unknown; href?: unknown } | undefined;
    const label = sanitizeString(incoming?.label);
    const href = sanitizeString(incoming?.href);
    if (!label || !href) return existing?.primaryNavButton as Prisma.JsonValue | null;
    return { label, href } as Prisma.JsonValue;
  })();

  const safeFeatureCards =
    normalizeArray<{ iconKey: string; title: string; description: string }>(
      payload.featureCards,
      (item) => {
        const iconKey = sanitizeString(item?.iconKey) || "";
        const title = sanitizeString(item?.title) || "";
        const description = sanitizeString(item?.description) || "";
        if (!iconKey && !title && !description) return null;
        return { iconKey, title, description };
      }
    ) ?? (existing?.featureCards as { iconKey: string; title: string; description: string }[] | null) ?? [];

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
    heroPrimaryCtaLabel:
      sanitizeString(payload.heroPrimaryCtaLabel) ??
      existing?.heroPrimaryCtaLabel ??
      DEFAULT_HOME_SETTINGS.heroPrimaryCtaLabel,
    heroPrimaryCtaHref:
      sanitizeString(payload.heroPrimaryCtaHref) ??
      existing?.heroPrimaryCtaHref ??
      DEFAULT_HOME_SETTINGS.heroPrimaryCtaHref,
    heroIllustrationUrl:
      sanitizeString(payload.heroIllustrationUrl) ??
      existing?.heroIllustrationUrl ??
      DEFAULT_HOME_SETTINGS.heroIllustrationUrl,
    heroImageUrl: sanitizeString(payload.heroImageUrl) ?? null,
    heroBackgroundImageUrl: sanitizeString(payload.heroBackgroundImageUrl) ?? null,
    siteLogoUrl: sanitizeString(payload.siteLogoUrl) ?? null,
    navbarLogoUrl: sanitizeString(payload.navbarLogoUrl) ?? null,
    faviconUrl: sanitizeString(payload.faviconUrl) ?? null,
    logoText: sanitizeString(payload.logoText) ?? existing?.logoText ?? DEFAULT_HOME_SETTINGS.logoText,
    logoSquareText:
      sanitizeString(payload.logoSquareText) ?? existing?.logoSquareText ?? DEFAULT_HOME_SETTINGS.logoSquareText,
    navLinks: safeNavLinks,
    primaryNavButton: safePrimaryButton ?? null,
    featureCards: safeFeatureCards,
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
        heroPrimaryCtaLabel: data.heroPrimaryCtaLabel,
        heroPrimaryCtaHref: data.heroPrimaryCtaHref,
        heroIllustrationUrl: data.heroIllustrationUrl,
        heroImageUrl: data.heroImageUrl,
        heroBackgroundImageUrl: data.heroBackgroundImageUrl,
        siteLogoUrl: data.siteLogoUrl,
        navbarLogoUrl: data.navbarLogoUrl,
        faviconUrl: data.faviconUrl,
        logoText: data.logoText,
        logoSquareText: data.logoSquareText,
        navLinks: data.navLinks as Prisma.InputJsonValue,
        primaryNavButton: data.primaryNavButton as Prisma.InputJsonValue,
        featureCards: data.featureCards as Prisma.InputJsonValue,
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
      heroPrimaryCtaLabel: data.heroPrimaryCtaLabel,
      heroPrimaryCtaHref: data.heroPrimaryCtaHref,
      heroIllustrationUrl: data.heroIllustrationUrl,
      heroImageUrl: data.heroImageUrl,
      heroBackgroundImageUrl: data.heroBackgroundImageUrl,
      siteLogoUrl: data.siteLogoUrl,
      navbarLogoUrl: data.navbarLogoUrl,
      faviconUrl: data.faviconUrl,
      logoText: data.logoText,
      logoSquareText: data.logoSquareText,
      navLinks: data.navLinks as Prisma.InputJsonValue,
      primaryNavButton: data.primaryNavButton as Prisma.InputJsonValue,
      featureCards: data.featureCards as Prisma.InputJsonValue,
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

