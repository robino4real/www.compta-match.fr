import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { HomepageSettingsDTO } from "../types/homepage";

const FALLBACK_SETTINGS: HomepageSettingsDTO = {
  heroTitle: "L’aide à la comptabilité des TPE au meilleur prix.",
  heroSubtitle:
    "Centralisez votre gestion comptable simplement, soyez toujours à jour, et concentrez-vous sur l’essentiel : votre activité.",
  heroButtonLabel: "Découvrir nos logiciels",
  heroButtonLink: "/comparatif-des-offres",
  heroIllustrationUrl:
    "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
  features: [
    {
      iconUrl: "✓",
      title: "Outils simples & complets",
      text: "Des outils intuitifs pour suivre votre comptabilité au quotidien.",
    },
    {
      iconUrl: "◎",
      title: "Tarifs transparents",
      text: "Des offres claires et sans surprise, adaptées aux TPE.",
    },
    {
      iconUrl: "☎",
      title: "Support dédié & réactif",
      text: "Une équipe qui répond vite pour vous accompagner.",
    },
  ],
  heroSections: [],
  heroTitleTag: "h1",
  heroSubtitleTag: "p",
  heroButtonStyle: "primary",
  navbarLogoUrl: null,
  faviconUrl: null,
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
