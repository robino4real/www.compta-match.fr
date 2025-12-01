import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

type HomepageSettingsDto = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonLink: string;
  heroTitleTag?: string;
  heroSubtitleTag?: string;
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
};

const FALLBACK_SETTINGS: HomepageSettingsDto = {
  heroTitle: "L’aide à la comptabilité des TPE au meilleur prix.",
  heroSubtitle:
    "Centralisez votre gestion comptable simplement, soyez toujours à jour, et concentrez-vous sur l’essentiel : votre activité.",
  heroButtonLabel: "Découvrir nos logiciels",
  heroButtonLink: "#",
  heroIllustrationUrl:
    "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
  feature1Icon: "✓",
  feature1Title: "Outils simples & complets",
  feature1Text: "Des outils intuitifs pour suivre votre comptabilité au quotidien.",
  feature2Icon: "◎",
  feature2Title: "Tarifs transparents",
  feature2Text: "Des offres claires et sans surprise, adaptées aux TPE.",
  feature3Icon: "☎",
  feature3Title: "Support dédié & réactif",
  feature3Text: "Une équipe qui répond vite pour vous accompagner.",
};

const FeatureCard: React.FC<{ icon: string; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="rounded-3xl border border-slate-100 bg-white px-6 py-6 shadow-sm">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200">
      <span className="text-sm">{icon}</span>
    </div>
    <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-600">{text}</p>
  </div>
);

const HomePage: React.FC = () => {
  const [data, setData] = useState<HomepageSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/homepage`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Impossible de charger la page d'accueil");
        }
        const json: HomepageSettingsDto = await res.json();
        if (!controller.signal.aborted) {
          setData({ ...FALLBACK_SETTINGS, ...json });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Erreur lors du chargement de la home", error);
        setData(FALLBACK_SETTINGS);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const settings = data || FALLBACK_SETTINGS;
  const TitleTag = (settings.heroTitleTag || "h1") as keyof JSX.IntrinsicElements;
  const SubtitleTag = (settings.heroSubtitleTag || "p") as keyof JSX.IntrinsicElements;

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:items-center md:py-20">
        {/* Texte gauche */}
        <div className="max-w-xl space-y-6">
          <TitleTag className="text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
            {settings.heroTitle}
          </TitleTag>
          <SubtitleTag className="text-sm leading-relaxed text-slate-600 md:text-base">
            {settings.heroSubtitle}
          </SubtitleTag>
          <a
            className="inline-flex items-center justify-center rounded-full bg-[#3066e4] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#2451b8]"
            href={settings.heroButtonLink || "#"}
            onClick={(e) => e.preventDefault()} // TODO: activer la navigation plus tard
          >
            {settings.heroButtonLabel}
          </a>
        </div>

        {/* Illustration droite */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative flex w-full max-w-md items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 py-8">
            <img
              src={settings.heroIllustrationUrl}
              alt="Illustration comptable"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      {/* 3 cartes de features */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3 md:py-14">
          <FeatureCard icon={settings.feature1Icon || "✓"} title={settings.feature1Title} text={settings.feature1Text} />
          <FeatureCard icon={settings.feature2Icon || "◎"} title={settings.feature2Title} text={settings.feature2Text} />
          <FeatureCard icon={settings.feature3Icon || "☎"} title={settings.feature3Title} text={settings.feature3Text} />
        </div>
      </section>
    </main>
  );
};

export default HomePage;
