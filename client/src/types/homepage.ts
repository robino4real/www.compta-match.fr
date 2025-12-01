export type FeatureIconKey = "apps" | "pricing" | "support" | "security" | "automation" | "custom";

export type HomepageSettingsDTO = {
  logoText: string;
  logoSquareText: string;
  navLinks: {
    label: string;
    href: string;
  }[];
  primaryNavButton: {
    label: string;
    href: string;
  } | null;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroIllustrationUrl: string;
  featureCards: {
    iconKey: FeatureIconKey;
    title: string;
    description: string;
  }[];
};
