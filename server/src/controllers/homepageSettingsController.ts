import { Request, Response } from "express";
import { HomepageSettings } from "@prisma/client";
import {
  getOrCreateHomepageSettings,
  updateHomepageSettings,
} from "../services/homepageSettingsService";

export type HomepageSettingsDTO = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonLink: string;
  heroIllustrationUrl: string;
  features: { title: string; text: string; iconUrl?: string }[];
  heroSections: {
    title: string;
    subtitle: string;
    buttonLabel: string;
    buttonLink: string;
    illustrationUrl: string;
    align?: "left" | "right";
  }[];
  heroTitleTag: string;
  heroSubtitleTag: string;
  heroButtonStyle: string;
  navbarLogoUrl?: string;
  faviconUrl?: string;
};

const FALLBACK_DTO: HomepageSettingsDTO = {
  heroTitle: "L’aide à la comptabilité des TPE au meilleur prix.",
  heroSubtitle:
    "Centralisez votre gestion comptable simplement, soyez toujours à jour, et concentrez-vous sur l’essentiel : votre activité.",
  heroButtonLabel: "Découvrir nos logiciels",
  heroButtonLink: "/offres",
  heroIllustrationUrl:
    "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
  features: [
    {
      iconUrl: "check",
      title: "Outils simples & complets",
      text: "Des outils intuitifs pour suivre votre comptabilité au quotidien.",
    },
    {
      iconUrl: "layers",
      title: "Tarifs transparents",
      text: "Des offres claires et sans surprise, adaptées aux TPE.",
    },
    {
      iconUrl: "support",
      title: "Support dédié & réactif",
      text: "Une équipe qui répond vite pour vous accompagner.",
    },
  ],
  heroSections: [],
  heroTitleTag: "h1",
  heroSubtitleTag: "p",
  heroButtonStyle: "primary",
  navbarLogoUrl: "",
  faviconUrl: "",
};

function sanitize(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function parseFeatures(settings: HomepageSettings | null) {
  const fromJson = Array.isArray(settings?.features)
    ? (settings?.features as any[]).map((item) => ({
        title: sanitize(item?.title) || "",
        text: sanitize(item?.text) || "",
        iconUrl: sanitize(item?.iconUrl) || "",
      }))
    : [];

  if (fromJson.some((feature) => feature.title || feature.text || feature.iconUrl)) {
    return fromJson;
  }

  const legacy = [
    {
      title: settings?.feature1Title || "",
      text: settings?.feature1Text || "",
      iconUrl: settings?.feature1Icon || "",
    },
    {
      title: settings?.feature2Title || "",
      text: settings?.feature2Text || "",
      iconUrl: settings?.feature2Icon || "",
    },
    {
      title: settings?.feature3Title || "",
      text: settings?.feature3Text || "",
      iconUrl: settings?.feature3Icon || "",
    },
  ].filter((feature) => feature.title || feature.text || feature.iconUrl);

  return legacy.length ? legacy : FALLBACK_DTO.features;
}

function parseHeroSections(settings: HomepageSettings | null) {
  if (!Array.isArray(settings?.heroSections)) return [];
  return (settings?.heroSections as any[])
    .map((section) => {
      const alignCandidate = sanitize(section?.align);
      const align: "left" | "right" = alignCandidate === "right" ? "right" : "left";
      return {
        title: sanitize(section?.title) || "",
        subtitle: sanitize(section?.subtitle) || "",
        buttonLabel: sanitize(section?.buttonLabel) || "",
        buttonLink: sanitize(section?.buttonLink) || "",
        illustrationUrl: sanitize(section?.illustrationUrl) || "",
        align,
      };
    })
    .filter((section) => section.title || section.subtitle || section.illustrationUrl);
}

function toDto(settings: HomepageSettings | null): HomepageSettingsDTO {
  const safe = settings ?? ({} as HomepageSettings);

  return {
    heroTitle: safe.heroTitle || FALLBACK_DTO.heroTitle,
    heroSubtitle: safe.heroSubtitle || FALLBACK_DTO.heroSubtitle,
    heroButtonLabel: safe.heroButtonLabel || FALLBACK_DTO.heroButtonLabel,
    heroButtonLink: safe.heroButtonLink || safe.heroButtonUrl || FALLBACK_DTO.heroButtonLink,
    heroIllustrationUrl:
      safe.heroIllustrationUrl || safe.heroImageUrl || FALLBACK_DTO.heroIllustrationUrl,
    features: parseFeatures(settings),
    heroSections: parseHeroSections(settings),
    heroTitleTag: safe.heroTitleTag || FALLBACK_DTO.heroTitleTag,
    heroSubtitleTag: safe.heroSubtitleTag || FALLBACK_DTO.heroSubtitleTag,
    heroButtonStyle: safe.heroButtonStyle || FALLBACK_DTO.heroButtonStyle,
    navbarLogoUrl: safe.navbarLogoUrl || FALLBACK_DTO.navbarLogoUrl,
    faviconUrl: safe.faviconUrl || FALLBACK_DTO.faviconUrl,
  };
}

export async function adminGetHomepageSettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateHomepageSettings();
    return res.json(toDto(settings));
  } catch (error) {
    console.error("Erreur lors du chargement de la home admin", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les réglages de la home." });
  }
}

export async function adminSaveHomepageSettings(req: Request, res: Response) {
  try {
    const settings = await updateHomepageSettings(req.body || {});
    return res.json(toDto(settings));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la home", error);
    return res
      .status(500)
      .json({ message: "Impossible d'enregistrer la page d'accueil." });
  }
}

export async function publicGetHomepage(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateHomepageSettings();
    return res.json(toDto(settings));
  } catch (error) {
    console.error("Erreur lors du chargement public de la home", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger la page d'accueil." });
  }
}
