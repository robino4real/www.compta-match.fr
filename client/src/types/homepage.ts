export type HomepageSeo = {
  title?: string | null;
  description?: string | null;
  ogImageUrl?: string | null;
};

export type HomepageBlock = {
  id: string;
  kind: string;
  order: number;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  buttonLabel?: string | null;
  buttonHref?: string | null;
  iconName?: string | null;
  value?: string | null;
  data?: Record<string, unknown>;
};

export type HomepageSection = {
  id: string;
  type: string;
  order: number;
  label?: string | null;
  backgroundStyle?: string | null;
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  settings?: Record<string, unknown>;
  blocks: HomepageBlock[];
};

export type HomepageResponse = {
  slug: string;
  seo?: HomepageSeo;
  branding?: {
    navbarLogoUrl?: string | null;
    faviconUrl?: string | null;
  };
  sections: HomepageSection[];
  isEmpty?: boolean;
};
