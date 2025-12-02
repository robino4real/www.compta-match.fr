import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

export type Feature = { title: string; description: string };
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
  heroButtonUrl: string;
  heroImageUrl?: string | null;
  heroBackgroundImageUrl?: string | null;
  siteLogoUrl?: string | null;
  navbarLogoUrl?: string | null;
  faviconUrl?: string | null;
  features?: Feature[];
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
  heroButtonUrl: "/offres",
  heroImageUrl: null,
  heroBackgroundImageUrl: null,
  siteLogoUrl: null,
  navbarLogoUrl: null,
  faviconUrl: null,
  features: [
    {
      title: "Simplicité",
      description: "Une interface claire pour suivre vos obligations et vos documents sans jargon inutile.",
    },
    {
      title: "Souplesse",
      description: "Choisissez entre outils téléchargeables et ressources en ligne.",
    },
    {
      title: "Support",
      description: "Une équipe disponible et des guides pour vous accompagner au quotidien.",
    },
  ],
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

function parseFeatures(value: unknown): Feature[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      title: typeof item?.title === "string" ? item.title : "",
      description: typeof item?.description === "string" ? item.description : "",
    }))
    .filter((item) => item.title || item.description);
}

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
  return {
    ...FALLBACK_SETTINGS,
    ...incoming,
    features: parseFeatures(incoming.features),
    testimonials: parseTestimonials(incoming.testimonials),
    highlightedProductIds: Array.isArray(incoming.highlightedProductIds)
      ? (incoming.highlightedProductIds as unknown[])
          .map((id) => (id == null ? null : String(id)))
          .filter((id): id is string => Boolean(id))
      : [],
  };
}

async function fetchPublicHomepage(): Promise<HookState> {
  if (cachedState) return cachedState;
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

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPublicHomepage();
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
    if (cachedState) return;
    load().catch(() => {
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
    reload: load,
  };
}

export { FALLBACK_SETTINGS as FALLBACK_HOMEPAGE_SETTINGS };
