import { HomepageSettings } from "@prisma/client";
import { prisma } from "../config/prisma";

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
> & { heroPrimaryCtaLabel: string; heroPrimaryCtaHref: string } = {
  heroTitle: "L’aide à la comptabilité des TPE au meilleur prix.",
  heroSubtitle:
    "Centralisez votre gestion comptable simplement, soyez toujours à jour, et concentrez-vous sur l’essentiel : votre activité.",
  heroButtonLabel: "Découvrir nos logiciels",
  heroButtonUrl: "#",
  heroButtonLink: "#",
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
  heroPrimaryCtaHref: "#",
  navbarLogoUrl: "",
  faviconUrl: "",
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
>;

function sanitize(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  return undefined;
}

function withDefault(value: unknown, fallback: string) {
  const sanitized = sanitize(value);
  return sanitized === undefined || sanitized === "" ? fallback : sanitized;
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
    existing.navbarLogoUrl || DEFAULT_HOME_SETTINGS.navbarLogoUrl
  );
  const faviconUrl = withDefault(
    payload.faviconUrl,
    existing.faviconUrl || DEFAULT_HOME_SETTINGS.faviconUrl
  );

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
      feature1Icon: withDefault(payload.feature1Icon, existing.feature1Icon || DEFAULT_HOME_SETTINGS.feature1Icon),
      feature1Title: withDefault(
        payload.feature1Title,
        existing.feature1Title || DEFAULT_HOME_SETTINGS.feature1Title
      ),
      feature1Text: withDefault(
        payload.feature1Text,
        existing.feature1Text || DEFAULT_HOME_SETTINGS.feature1Text
      ),
      feature2Icon: withDefault(payload.feature2Icon, existing.feature2Icon || DEFAULT_HOME_SETTINGS.feature2Icon),
      feature2Title: withDefault(
        payload.feature2Title,
        existing.feature2Title || DEFAULT_HOME_SETTINGS.feature2Title
      ),
      feature2Text: withDefault(
        payload.feature2Text,
        existing.feature2Text || DEFAULT_HOME_SETTINGS.feature2Text
      ),
      feature3Icon: withDefault(payload.feature3Icon, existing.feature3Icon || DEFAULT_HOME_SETTINGS.feature3Icon),
      feature3Title: withDefault(
        payload.feature3Title,
        existing.feature3Title || DEFAULT_HOME_SETTINGS.feature3Title
      ),
      feature3Text: withDefault(
        payload.feature3Text,
        existing.feature3Text || DEFAULT_HOME_SETTINGS.feature3Text
      ),
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

