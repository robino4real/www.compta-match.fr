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
  feature1Icon: string;
  feature1Title: string;
  feature1Text: string;
  feature2Icon: string;
  feature2Title: string;
  feature2Text: string;
  feature3Icon: string;
  feature3Title: string;
  feature3Text: string;
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
  navbarLogoUrl: "",
  faviconUrl: "",
};

function toDto(settings: HomepageSettings | null): HomepageSettingsDTO {
  const safe = settings ?? ({} as HomepageSettings);

  return {
    heroTitle: safe.heroTitle || FALLBACK_DTO.heroTitle,
    heroSubtitle: safe.heroSubtitle || FALLBACK_DTO.heroSubtitle,
    heroButtonLabel: safe.heroButtonLabel || FALLBACK_DTO.heroButtonLabel,
    heroButtonLink: safe.heroButtonLink || safe.heroButtonUrl || FALLBACK_DTO.heroButtonLink,
    heroIllustrationUrl:
      safe.heroIllustrationUrl || safe.heroImageUrl || FALLBACK_DTO.heroIllustrationUrl,
    feature1Icon: safe.feature1Icon || FALLBACK_DTO.feature1Icon,
    feature1Title: safe.feature1Title || FALLBACK_DTO.feature1Title,
    feature1Text: safe.feature1Text || FALLBACK_DTO.feature1Text,
    feature2Icon: safe.feature2Icon || FALLBACK_DTO.feature2Icon,
    feature2Title: safe.feature2Title || FALLBACK_DTO.feature2Title,
    feature2Text: safe.feature2Text || FALLBACK_DTO.feature2Text,
    feature3Icon: safe.feature3Icon || FALLBACK_DTO.feature3Icon,
    feature3Title: safe.feature3Title || FALLBACK_DTO.feature3Title,
    feature3Text: safe.feature3Text || FALLBACK_DTO.feature3Text,
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
