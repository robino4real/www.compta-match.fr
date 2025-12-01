import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { HomepageSettingsDTO } from "../types/homepage";

const FALLBACK_SETTINGS: HomepageSettingsDTO = {
  logoText: "COMPTAMATCH",
  logoSquareText: "CM",
  navLinks: [
    { label: "Comparer les offres", href: "/offres" },
    { label: "Nos logiciels", href: "/telechargements" },
    { label: "Contact", href: "/contact" },
  ],
  primaryNavButton: { label: "Contact", href: "/contact" },
  heroTitle: "La plateforme pour trouver et comparer vos logiciels comptables",
  heroSubtitle:
    "Centralisez vos outils, comparez les offres et gardez une vue claire sur votre comptabilité en quelques clics.",
  heroPrimaryCtaLabel: "Découvrir nos logiciels",
  heroPrimaryCtaHref: "/telechargements",
  heroIllustrationUrl:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  featureCards: [
    {
      iconKey: "apps",
      title: "Outils simples & complets",
      description: "Des logiciels sélectionnés pour aller à l'essentiel sans jargon inutile.",
    },
    {
      iconKey: "pricing",
      title: "Tarifs transparents",
      description: "Comparez facilement les offres et choisissez celle qui vous convient.",
    },
    {
      iconKey: "support",
      title: "Support réactif",
      description: "Une équipe pour vous accompagner et des guides pratiques toujours accessibles.",
    },
  ],
};

export function useHomepageContent() {
  const [settings, setSettings] = useState<HomepageSettingsDTO>(FALLBACK_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/public/homepage`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger la page d'accueil.");
        }
        if (isMounted) {
          setSettings({ ...FALLBACK_SETTINGS, ...(data as HomepageSettingsDTO) });
        }
      } catch (err: any) {
        console.error("Erreur chargement homepage", err);
        if (isMounted) {
          setError(err?.message || "Impossible de charger la page d'accueil.");
          setSettings(FALLBACK_SETTINGS);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return { settings, isLoading, error };
}
