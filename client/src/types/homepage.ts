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

export type HomepageContentBlock = {
  id: string;
  kind: "identity" | "experience" | "story" | "feature-grid" | "cta";
  title: string;
  subtitle?: string;
  body?: string;
  buttonLabel?: string;
  buttonLink?: string;
  bullets?: string[];
  badge?: string;
  imageUrl?: string;
  mutedText?: string;
  imagePosition?: "left" | "right";
  revealAnimation?: boolean;
};

export type HomepageSettingsDTO = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonLink: string;
  heroIllustrationUrl: string;
  features: HomepageFeature[];
  heroSections: HomepageHeroSection[];
  blocks: HomepageContentBlock[];
  heroTitleTag?: string;
  heroSubtitleTag?: string;
  heroButtonStyle?: string;
  navbarLogoUrl?: string | null;
  faviconUrl?: string | null;
};
