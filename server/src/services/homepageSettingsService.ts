import { HomepageSettings } from "@prisma/client";
import { prisma } from "../config/prisma";

type FeatureCard = { title: string; text: string; iconUrl?: string };

type HeroSection = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
  illustrationUrl: string;
  align?: "left" | "right";
};

const DEFAULT_HOME_SETTINGS: Pick<
  HomepageSettings,
  | "heroTitle"
  | "heroSubtitle"
  | "heroButtonLabel"
  | "heroButtonUrl"
  | "heroButtonLink"
  | "heroIllustrationUrl"
  | "feature1Icon"
  | "feature1Title"
  | "feature1Text"
  | "feature2Icon"
  | "feature2Title"
  | "feature2Text"
  | "feature3Icon"
  | "feature3Title"
  | "feature3Text"
  | "heroTitleTag"
  | "heroSubtitleTag"
  | "heroButtonStyle"
  | "navbarLogoUrl"
  | "faviconUrl"
> & {
    heroPrimaryCtaLabel: string;
    heroPrimaryCtaHref: string;
    features: FeatureCard[];
    heroSections: HeroSection[];
  } = {
  heroTitle: "L’aide à la comptabilité des TPE au meilleur prix.",
  heroSubtitle:
    "Centralisez votre gestion comptable simplement, soyez toujours à jour, et concentrez-vous sur l’essentiel : votre activité.",
  heroButtonLabel: "Découvrir nos logiciels",
  heroButtonUrl: "/offres",
  heroButtonLink: "/offres",
  heroIllustrationUrl:
    "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
  feature1Icon: "check",
  feature1Title: "Outils simples & complets",
  feature1Text: "Des outils intuitifs pour suivre votre comptabilité au quotidien.",
  feature2Icon: "layers",
  feature2Title: "Tarifs transparents",
  feature2Text: "Des offres claires et sans surprise, adaptées aux TPE.",
  feature3Icon: "support",
  feature3Title: "Support dédié & réactif",
  feature3Text: "Une équipe qui répond vite pour vous accompagner.",
  heroTitleTag: "h1",
  heroSubtitleTag: "p",
  heroButtonStyle: "primary",
  heroPrimaryCtaLabel: "Découvrir nos logiciels",
  heroPrimaryCtaHref: "/offres",
  navbarLogoUrl: "",
  faviconUrl: "",
  features: [
    {
      title: "Outils simples & complets",
      text: "Des outils intuitifs pour suivre votre comptabilité au quotidien.",
      iconUrl: "",
    },
    {
      title: "Tarifs transparents",
      text: "Des offres claires et sans surprise, adaptées aux TPE.",
      iconUrl: "",
    },
    {
      title: "Support dédié & réactif",
      text: "Une équipe qui répond vite pour vous accompagner.",
      iconUrl: "",
    },
  ],
  heroSections: [],
};

type HomepageEditableFields = Pick<
  HomepageSettings,
  | "heroTitle"
  | "heroSubtitle"
  | "heroButtonLabel"
  | "heroButtonLink"
  | "heroIllustrationUrl"
  | "feature1Icon"
  | "feature1Title"
  | "feature1Text"
  | "feature2Icon"
  | "feature2Title"
  | "feature2Text"
  | "feature3Icon"
  | "feature3Title"
  | "feature3Text"
  | "heroTitleTag"
  | "heroSubtitleTag"
  | "heroButtonStyle"
  | "navbarLogoUrl"
  | "faviconUrl"
> & {
  features?: FeatureCard[];
  heroSections?: HeroSection[];
};

function sanitize(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  return undefined;
}

function sanitizeFeatureList(value: unknown): FeatureCard[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .map((entry) => ({
      title: sanitize((entry as any)?.title) || "",
      text: sanitize((entry as any)?.text) || "",
      iconUrl: sanitize((entry as any)?.iconUrl) || "",
    }))
    .filter((entry) => entry.title || entry.text || entry.iconUrl);

  if (!cleaned) return undefined;
  return cleaned;
}

function sanitizeHeroSections(value: unknown): HeroSection[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .map((entry) => {
      const alignCandidate = sanitize((entry as any)?.align);
      const align: "left" | "right" = alignCandidate === "right" ? "right" : "left";

      return {
        title: sanitize((entry as any)?.title) || "",
        subtitle: sanitize((entry as any)?.subtitle) || "",
        buttonLabel: sanitize((entry as any)?.buttonLabel) || "",
        buttonLink: sanitize((entry as any)?.buttonLink) || "",
        illustrationUrl: sanitize((entry as any)?.illustrationUrl) || "",
        align,
      };
    })
    .filter((entry) => entry.title || entry.subtitle || entry.illustrationUrl);

  return cleaned;
}

function withDefault(value: unknown, fallback: string) {
  const sanitized = sanitize(value);
  return sanitized === undefined || sanitized === "" ? fallback : sanitized;
}

function normalizeFeatures(
  incoming: FeatureCard[] | undefined,
  existing: HomepageSettings
): FeatureCard[] {
  if (incoming) return incoming;

  if (Array.isArray(existing.features)) {
    return sanitizeFeatureList(existing.features) ?? DEFAULT_HOME_SETTINGS.features;
  }

  const legacy = [
    {
      title: existing.feature1Title || DEFAULT_HOME_SETTINGS.feature1Title,
      text: existing.feature1Text || DEFAULT_HOME_SETTINGS.feature1Text,
      iconUrl: existing.feature1Icon || DEFAULT_HOME_SETTINGS.feature1Icon,
    },
    {
      title: existing.feature2Title || DEFAULT_HOME_SETTINGS.feature2Title,
      text: existing.feature2Text || DEFAULT_HOME_SETTINGS.feature2Text,
      iconUrl: existing.feature2Icon || DEFAULT_HOME_SETTINGS.feature2Icon,
    },
    {
      title: existing.feature3Title || DEFAULT_HOME_SETTINGS.feature3Title,
      text: existing.feature3Text || DEFAULT_HOME_SETTINGS.feature3Text,
      iconUrl: existing.feature3Icon || DEFAULT_HOME_SETTINGS.feature3Icon,
    },
  ].filter((feature) => feature.title || feature.text || feature.iconUrl);

  return legacy.length ? legacy : DEFAULT_HOME_SETTINGS.features;
}

function normalizeHeroSections(
  incoming: HeroSection[] | undefined,
  existing: HomepageSettings
): HeroSection[] {
  if (incoming) return incoming;
  if (Array.isArray(existing.heroSections)) {
    return sanitizeHeroSections(existing.heroSections) ?? [];
  }
  return [];
}

export async function getOrCreateHomepageSettings(): Promise<HomepageSettings> {
  return prisma.homepageSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      heroTitle: DEFAULT_HOME_SETTINGS.heroTitle,
      heroSubtitle: DEFAULT_HOME_SETTINGS.heroSubtitle,
      heroButtonLabel: DEFAULT_HOME_SETTINGS.heroButtonLabel,
      heroButtonUrl: DEFAULT_HOME_SETTINGS.heroButtonUrl,
      heroButtonLink: DEFAULT_HOME_SETTINGS.heroButtonLink,
      heroPrimaryCtaLabel: DEFAULT_HOME_SETTINGS.heroPrimaryCtaLabel,
      heroPrimaryCtaHref: DEFAULT_HOME_SETTINGS.heroPrimaryCtaHref,
      heroIllustrationUrl: DEFAULT_HOME_SETTINGS.heroIllustrationUrl,
      navbarLogoUrl: DEFAULT_HOME_SETTINGS.navbarLogoUrl,
      faviconUrl: DEFAULT_HOME_SETTINGS.faviconUrl,
      feature1Icon: DEFAULT_HOME_SETTINGS.feature1Icon,
      feature1Title: DEFAULT_HOME_SETTINGS.feature1Title,
      feature1Text: DEFAULT_HOME_SETTINGS.feature1Text,
      feature2Icon: DEFAULT_HOME_SETTINGS.feature2Icon,
      feature2Title: DEFAULT_HOME_SETTINGS.feature2Title,
      feature2Text: DEFAULT_HOME_SETTINGS.feature2Text,
      feature3Icon: DEFAULT_HOME_SETTINGS.feature3Icon,
      feature3Title: DEFAULT_HOME_SETTINGS.feature3Title,
      feature3Text: DEFAULT_HOME_SETTINGS.feature3Text,
      heroTitleTag: DEFAULT_HOME_SETTINGS.heroTitleTag,
      heroSubtitleTag: DEFAULT_HOME_SETTINGS.heroSubtitleTag,
      heroButtonStyle: DEFAULT_HOME_SETTINGS.heroButtonStyle,
      features: DEFAULT_HOME_SETTINGS.features,
      heroSections: DEFAULT_HOME_SETTINGS.heroSections,
    },
  });
}

export async function updateHomepageSettings(
  payload: Partial<HomepageEditableFields>
): Promise<HomepageSettings> {
  const existing = await getOrCreateHomepageSettings();

  const heroTitle = withDefault(payload.heroTitle, existing.heroTitle || DEFAULT_HOME_SETTINGS.heroTitle);
  const heroSubtitle = withDefault(
    payload.heroSubtitle,
    existing.heroSubtitle || DEFAULT_HOME_SETTINGS.heroSubtitle
  );
  const heroButtonLabel = withDefault(
    payload.heroButtonLabel,
    existing.heroButtonLabel || DEFAULT_HOME_SETTINGS.heroButtonLabel
  );
  const heroButtonLink = withDefault(
    payload.heroButtonLink,
    existing.heroButtonLink || DEFAULT_HOME_SETTINGS.heroButtonLink
  );
  const defaultHeroIllustrationUrl =
    DEFAULT_HOME_SETTINGS.heroIllustrationUrl ?? "";
  const heroIllustrationUrl = withDefault(
    payload.heroIllustrationUrl,
    existing.heroIllustrationUrl ?? defaultHeroIllustrationUrl
  );
  const navbarLogoUrl = withDefault(
    payload.navbarLogoUrl,
    existing.navbarLogoUrl ?? DEFAULT_HOME_SETTINGS.navbarLogoUrl ?? ""
  );
  const faviconUrl = withDefault(
    payload.faviconUrl,
    existing.faviconUrl ?? DEFAULT_HOME_SETTINGS.faviconUrl ?? ""
  );

  const normalizedFeatures = sanitizeFeatureList(payload.features) ?? normalizeFeatures(undefined, existing);
  const normalizedHeroSections = sanitizeHeroSections(payload.heroSections) ?? normalizeHeroSections(undefined, existing);

  return prisma.homepageSettings.update({
    where: { id: existing.id },
    data: {
      heroTitle,
      heroSubtitle,
      heroButtonLabel,
      heroButtonUrl: heroButtonLink,
      heroButtonLink,
      heroPrimaryCtaLabel: heroButtonLabel,
      heroPrimaryCtaHref: heroButtonLink,
      heroIllustrationUrl,
      navbarLogoUrl,
      faviconUrl,
      features: normalizedFeatures,
      heroSections: normalizedHeroSections,
      feature1Icon: normalizedFeatures[0]?.iconUrl ?? "",
      feature1Title: normalizedFeatures[0]?.title ?? "",
      feature1Text: normalizedFeatures[0]?.text ?? "",
      feature2Icon: normalizedFeatures[1]?.iconUrl ?? "",
      feature2Title: normalizedFeatures[1]?.title ?? "",
      feature2Text: normalizedFeatures[1]?.text ?? "",
      feature3Icon: normalizedFeatures[2]?.iconUrl ?? "",
      feature3Title: normalizedFeatures[2]?.title ?? "",
      feature3Text: normalizedFeatures[2]?.text ?? "",
      heroTitleTag: withDefault(
        payload.heroTitleTag,
        existing.heroTitleTag || DEFAULT_HOME_SETTINGS.heroTitleTag
      ),
      heroSubtitleTag: withDefault(
        payload.heroSubtitleTag,
        existing.heroSubtitleTag || DEFAULT_HOME_SETTINGS.heroSubtitleTag
      ),
      heroButtonStyle: withDefault(
        payload.heroButtonStyle,
        existing.heroButtonStyle || DEFAULT_HOME_SETTINGS.heroButtonStyle
      ),
    },
  });
}

