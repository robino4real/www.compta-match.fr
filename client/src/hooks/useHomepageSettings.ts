import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { HomepageContentBlock, HomepageFeature, HomepageHeroSection } from "../types/homepage";

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
  heroIllustrationUrl?: string | null;
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
  blocks?: HomepageContentBlock[];
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
  heroIllustrationUrl: null,
  heroBackgroundImageUrl: null,
  siteLogoUrl: null,
  navbarLogoUrl: null,
  faviconUrl: null,
  features: [],
  heroSections: [],
  blocks: [],
  highlightedProductIds: [],
  testimonials: [],
  contentBlockTitle: "",
  contentBlockBody: "",
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

function normalizeBlocks(value: unknown): HomepageContentBlock[] {
  const incoming = Array.isArray(value) ? (value as unknown[]) : [];

  const sanitized = incoming
    .map((block, index) => {
      const kindCandidate = typeof (block as any)?.kind === "string" ? (block as any)?.kind : "";
      const kind: HomepageContentBlock["kind"] =
        kindCandidate === "experience" ||
        kindCandidate === "story" ||
        kindCandidate === "feature-grid" ||
        kindCandidate === "cta" ||
        kindCandidate === "identity"
          ? (kindCandidate as HomepageContentBlock["kind"])
          : "experience";

      const bullets = Array.isArray((block as any)?.bullets)
        ? ((block as any)?.bullets as unknown[])
            .map((item) => (typeof item === "string" ? item : ""))
            .filter(Boolean)
        : [];

      return {
        id:
          typeof (block as any)?.id === "string" && (block as any)?.id
            ? (block as any)?.id
            : `block-${index}`,
        kind,
        title: typeof (block as any)?.title === "string" ? (block as any)?.title : "",
        subtitle: typeof (block as any)?.subtitle === "string" ? (block as any)?.subtitle : "",
        body: typeof (block as any)?.body === "string" ? (block as any)?.body : "",
        buttonLabel: typeof (block as any)?.buttonLabel === "string" ? (block as any)?.buttonLabel : "",
        buttonLink: typeof (block as any)?.buttonLink === "string" ? (block as any)?.buttonLink : "",
        bullets,
        badge: typeof (block as any)?.badge === "string" ? (block as any)?.badge : "",
        imageUrl: typeof (block as any)?.imageUrl === "string" ? (block as any)?.imageUrl : "",
        mutedText: typeof (block as any)?.mutedText === "string" ? (block as any)?.mutedText : "",
        imagePosition:
          typeof (block as any)?.imagePosition === "string" && (block as any)?.imagePosition === "left"
            ? "left"
            : "right",
        revealAnimation:
          typeof (block as any)?.revealAnimation === "boolean"
            ? Boolean((block as any)?.revealAnimation)
            : true,
      } satisfies HomepageContentBlock;
    })
    .filter((block) => block.title || block.subtitle || block.body || block.kind === "identity");

  return sanitized.length ? sanitized : FALLBACK_SETTINGS.blocks ?? [];
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
    heroIllustrationUrl:
      typeof incoming.heroIllustrationUrl === "string"
        ? incoming.heroIllustrationUrl
        : typeof incoming.heroImageUrl === "string"
          ? incoming.heroImageUrl
          : FALLBACK_SETTINGS.heroIllustrationUrl,
    heroImageUrl: typeof incoming.heroImageUrl === "string" ? incoming.heroImageUrl : FALLBACK_SETTINGS.heroImageUrl,
    features: normalizedFeatures,
    heroSections: normalizedHeroSections,
    blocks: normalizeBlocks(incoming.blocks),
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
      const cacheBuster = forceRefresh ? `?_=${Date.now()}` : "";
      const response = await fetch(`${API_BASE_URL}/public/homepage${cacheBuster}`, {
        cache: "no-store",
      });
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
    cachedState?.highlightedProducts ?? [],
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

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;

    const streamUrl = `${API_BASE_URL}/public/homepage/stream`;
    let source: EventSource | null = null;
    let retryTimer: NodeJS.Timeout | null = null;
    let isActive = true;

    const attach = () => {
      if (!isActive) return;
      if (source) {
        source.close();
      }

      source = new EventSource(streamUrl);

      const handleMessage = () => {
        load(true).catch(() => {
          /* handled in load */
        });
      };

      source.addEventListener("message", handleMessage);

      source.onerror = () => {
        source?.removeEventListener("message", handleMessage);
        source?.close();
        source = null;
        if (retryTimer) {
          clearTimeout(retryTimer);
        }
        retryTimer = setTimeout(() => {
          load(true).catch(() => {
            /* handled in load */
          });
          attach();
        }, 1500);
      };
    };

    attach();

    return () => {
      isActive = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (source) {
        source.close();
      }
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
