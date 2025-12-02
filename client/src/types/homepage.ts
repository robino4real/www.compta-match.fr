export type HomepageFeature = {
  title: string;
  text: string;
  iconUrl?: string;
};

export type HomepageHeroSection = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
  illustrationUrl: string;
  align?: "left" | "right";
};

export type HomepageSettingsDTO = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonLink: string;
  heroIllustrationUrl: string;
  features: HomepageFeature[];
  heroSections: HomepageHeroSection[];
  heroTitleTag?: string;
  heroSubtitleTag?: string;
  heroButtonStyle?: string;
  navbarLogoUrl?: string | null;
  faviconUrl?: string | null;
};
