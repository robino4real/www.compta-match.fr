import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { HomepageFeature, HomepageHeroSection } from "../types/homepage";

export type Testimonial = { name: string; role: string; text: string };

export type HighlightedProduct = {
  id: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  priceCents: number;
  currency: string;
  slug: string;
};

export type HomepageSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonLink: string;
  heroImageUrl?: string | null;
  heroBackgroundImageUrl?: string | null;
  siteLogoUrl?: string | null;
  navbarLogoUrl?: string | null;
  faviconUrl?: string | null;
  features: HomepageFeature[];
  heroSections: HomepageHeroSection[];
  highlightedProductIds?: string[];
  testimonials?: Testimonial[];
  contentBlockTitle?: string | null;
  contentBlockBody?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

const FALLBACK_SETTINGS: HomepageSettings = {
  heroTitle: "Bienvenue chez COMPTAMATCH",
  heroSubtitle:
    "Outils et contenus pour aider les TPE, micro-entreprises et indépendants à piloter leur comptabilité.",
  heroButtonLabel: "Découvrir nos offres",
  heroButtonLink: "/comparatif-des-offres",
  heroImageUrl: null,
  heroBackgroundImageUrl: null,
  siteLogoUrl: null,
  navbarLogoUrl: null,
  faviconUrl: null,
  features: [
    {
      title: "Simplicité",
      text: "Une interface claire pour suivre vos obligations et vos documents sans jargon inutile.",
      iconUrl: "",
    },
    {
      title: "Souplesse",
      text: "Choisissez entre outils téléchargeables et ressources en ligne.",
      iconUrl: "",
    },
    {
      title: "Support",
      text: "Une équipe disponible et des guides pour vous accompagner au quotidien.",
      iconUrl: "",
    },
  ],
  heroSections: [],
  highlightedProductIds: [],
  testimonials: [],
  contentBlockTitle: "Une approche pragmatique",
  contentBlockBody:
    "ComptaMatch privilégie des outils sobres, des explications concrètes et des téléchargements fiables pour vos logiciels.",
  seoTitle: "ComptaMatch | Solutions comptables pour petites entreprises",
  seoDescription:
    "Logiciels et contenus pour simplifier la comptabilité des TPE, indépendants et micro-entrepreneurs.",
};

type PublicHomepagePayload = {
  settings?: HomepageSettings;
  highlightedProducts?: HighlightedProduct[];
  structuredData?: any[];
};

type HookState = {
  settings: HomepageSettings;
  highlightedProducts: HighlightedProduct[];
  structuredData: any[] | null;
};

let cachedState: HookState | null = null;
let inflightRequest: Promise<HookState> | null = null;

function parseTestimonials(value: unknown): Testimonial[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      name: typeof item?.name === "string" ? item.name : "",
      role: typeof item?.role === "string" ? item.role : "",
      text: typeof item?.text === "string" ? item.text : "",
    }))
    .filter((item) => item.name || item.role || item.text);
}

function normalizeSettings(incoming: HomepageSettings | undefined): HomepageSettings {
  if (!incoming) return FALLBACK_SETTINGS;
  const normalizedFeatures = Array.isArray(incoming.features)
    ? incoming.features.map((feature) => ({
        title: typeof feature?.title === "string" ? feature.title : "",
        text: typeof (feature as any)?.text === "string" ? (feature as any).text : "",
        iconUrl: typeof feature?.iconUrl === "string" ? feature.iconUrl : "",
      }))
    : [];

  const normalizedHeroSections = Array.isArray(incoming.heroSections)
    ? incoming.heroSections.map((section) => ({
        title: typeof section?.title === "string" ? section.title : "",
        subtitle: typeof section?.subtitle === "string" ? section.subtitle : "",
        buttonLabel: typeof section?.buttonLabel === "string" ? section.buttonLabel : "",
        buttonLink: typeof section?.buttonLink === "string" ? section.buttonLink : "",
        illustrationUrl: typeof section?.illustrationUrl === "string" ? section.illustrationUrl : "",
        align: section?.align === "right" ? "right" : "left",
      }))
    : [];

  return {
    ...FALLBACK_SETTINGS,
    ...incoming,
    features: normalizedFeatures.length ? normalizedFeatures : FALLBACK_SETTINGS.features,
    heroSections: normalizedHeroSections,
    testimonials: parseTestimonials(incoming.testimonials),
    highlightedProductIds: Array.isArray(incoming.highlightedProductIds)
      ? (incoming.highlightedProductIds as unknown[])
          .map((id) => (id == null ? null : String(id)))
          .filter((id): id is string => Boolean(id))
      : [],
  };
}

async function fetchPublicHomepage(forceRefresh = false): Promise<HookState> {
  if (forceRefresh) {
    cachedState = null;
  }

  if (cachedState && !forceRefresh) return cachedState;
  if (inflightRequest) return inflightRequest;

  inflightRequest = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/homepage`);
      const data = (await response.json().catch(() => ({}))) as PublicHomepagePayload;
      if (!response.ok) {
        throw new Error(data?.message || "Impossible de charger la page d'accueil.");
      }

      const settings = normalizeSettings(data.settings);
      const highlightedProducts = Array.isArray(data.highlightedProducts)
        ? data.highlightedProducts
        : [];
      const structuredData = Array.isArray(data.structuredData) ? data.structuredData : null;

      const hydrated: HookState = { settings, highlightedProducts, structuredData };
      cachedState = hydrated;
      return hydrated;
    } finally {
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}

export function useHomepageSettings() {
  const [settings, setSettings] = useState<HomepageSettings>(cachedState?.settings ?? FALLBACK_SETTINGS);
  const [highlightedProducts, setHighlightedProducts] = useState<HighlightedProduct[]>(
    cachedState?.highlightedProducts ?? []
  );
  const [structuredData, setStructuredData] = useState<any[] | null>(cachedState?.structuredData ?? null);
  const [isLoading, setIsLoading] = useState(!cachedState);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPublicHomepage(forceRefresh);
      setSettings(result.settings);
      setHighlightedProducts(result.highlightedProducts);
      setStructuredData(result.structuredData ?? null);
    } catch (err: any) {
      console.error("Erreur de chargement des réglages de la home", err);
      setError(err?.message || "Impossible de charger la page d'accueil.");
      setSettings(FALLBACK_SETTINGS);
      setHighlightedProducts([]);
      setStructuredData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true).catch(() => {
      /* handled in load */
    });
    return () => {
      inflightRequest = null;
    };
  }, [load]);

  return {
    settings,
    highlightedProducts,
    structuredData,
    isLoading,
    error,
    reload: () => load(true),
  };
}

export { FALLBACK_SETTINGS as FALLBACK_HOMEPAGE_SETTINGS };
