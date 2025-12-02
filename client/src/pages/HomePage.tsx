import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHomepageSettings } from "../hooks/useHomepageSettings";
import { HomepageFeature, HomepageHeroSection } from "../types/homepage";

const FeatureCard: React.FC<{ feature: HomepageFeature }> = ({ feature }) => (
  <article className="group rounded-3xl border border-slate-100 bg-white/70 p-6 shadow-sm backdrop-blur transition duration-500 hover:-translate-y-1 hover:shadow-2xl">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/80">
      {feature.iconUrl ? (
        <img src={feature.iconUrl} alt={feature.title} className="h-8 w-8 object-contain" loading="lazy" />
      ) : (
        <span className="text-lg">★</span>
      )}
    </div>
    <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
    <p className="text-sm leading-relaxed text-slate-600">{feature.text}</p>
  </article>
);

const StoryPoint: React.FC<{
  section: HomepageHeroSection;
  index: number;
  onVisible: (index: number) => void;
}> = ({ section, index, onVisible }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisible(index);
          }
        });
      },
      { rootMargin: "-30% 0px -40% 0px", threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [index, onVisible]);

  return (
    <div ref={ref} className="reveal-on-scroll space-y-3 rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Phase {index + 1}</p>
      <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{section.subtitle}</p>
      <a
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b2e6f] transition hover:translate-x-1"
        href={section.buttonLink || "/comparatif-des-offres"}
      >
        {section.buttonLabel || "Découvrir"}
        <span aria-hidden>→</span>
      </a>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { settings, isLoading } = useHomepageSettings();

  const TitleTag = (settings.heroTitleTag || "h1") as keyof JSX.IntrinsicElements;
  const SubtitleTag = (settings.heroSubtitleTag || "p") as keyof JSX.IntrinsicElements;
  const heroSections = settings.heroSections || [];
  const features = settings.features || [];

  const [activePinnedIndex, setActivePinnedIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const heroVisualRef = useRef<HTMLDivElement | null>(null);

  const heroVisualUrl =
    settings.heroIllustrationUrl || settings.heroImageUrl || settings.heroBackgroundImageUrl || settings.navbarLogoUrl || "";

  const storyPoints: HomepageHeroSection[] = useMemo(() => {
    if (heroSections.length > 0) return heroSections;

    return [
      {
        title: "Vue claire sur vos obligations",
        subtitle: "Un tableau de bord qui met en avant vos échéances et vos pièces comptables, sans distraction.",
        buttonLabel: settings.heroButtonLabel || "Explorer",
        buttonLink: settings.heroButtonLink || "/comparatif-des-offres",
        illustrationUrl: heroVisualUrl,
        align: "left",
      },
      {
        title: "Documents prêts à partager",
        subtitle: "Exportez vos justificatifs, reçus et synthèses dans des formats compatibles avec votre cabinet comptable.",
        buttonLabel: settings.heroButtonLabel || "Voir les formats",
        buttonLink: settings.heroButtonLink || "/comparatif-des-offres",
        illustrationUrl: heroVisualUrl,
        align: "right",
      },
      {
        title: "Synchronisé avec votre back-office",
        subtitle:
          "Logos, visuels et liens sont pilotés depuis le back-office ComptaMatch pour garder la page d'accueil toujours alignée avec vos actualités.",
        buttonLabel: settings.heroButtonLabel || "Configurer",
        buttonLink: settings.heroButtonLink || "/comparatif-des-offres",
        illustrationUrl: heroVisualUrl,
        align: "left",
      },
    ];
  }, [heroSections, heroVisualUrl, settings.heroButtonLabel, settings.heroButtonLink]);

  useEffect(() => {
    document.documentElement.classList.add("scroll-animations-ready");
    return () => document.documentElement.classList.remove("scroll-animations-ready");
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const nodes = document.querySelectorAll<HTMLElement>(".reveal-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.2, rootMargin: "-10% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const node = heroRef.current;
      const visual = heroVisualRef.current;
      if (!node || !visual) return;

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const distance = Math.min(Math.max(1 - rect.top / viewportHeight, 0), 1);
      const progress = Math.min(Math.max(distance, 0), 1);

      visual.style.setProperty("--hero-progress", progress.toString());
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const onStoryVisible = (index: number) => {
    setActivePinnedIndex(index);
  };

  if (isLoading && !settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="bg-white text-slate-900">
      <section ref={heroRef} className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />
          {settings.heroBackgroundImageUrl && (
            <div
              aria-hidden
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 20%, rgba(11,46,111,0.12), transparent 38%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.12), transparent 42%), url(${settings.heroBackgroundImageUrl})`,
                backgroundSize: "cover, cover, cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                filter: "saturate(1.05)",
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0b2e6f]/6 via-transparent to-[#0b2e6f]/8" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-4 pb-16 pt-24 md:flex-row md:items-center md:gap-12 md:pb-24 md:pt-28">
          <div className="reveal-on-scroll relative z-10 max-w-xl space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 ring-1 ring-slate-200/80">
              ComptaMatch
              <span className="h-1.5 w-1.5 rounded-full bg-[#0b2e6f]" />
            </p>
            <TitleTag className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              {settings.heroTitle}
            </TitleTag>
            <SubtitleTag className="text-lg leading-relaxed text-slate-600 md:text-xl">
              {settings.heroSubtitle}
            </SubtitleTag>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                className="pressable-button inline-flex items-center justify-center gap-2 rounded-full bg-[#0b2e6f] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0b2e6f]/20 transition hover:-translate-y-1 hover:bg-[#0a275d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b2e6f]"
                href={settings.heroButtonLink || "/comparatif-des-offres"}
              >
                {settings.heroButtonLabel || "Découvrir nos offres"}
                <span aria-hidden>→</span>
              </a>
              <a
                className="pressable-button inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:text-[#0b2e6f]"
                href="#experience"
              >
                Voir l'expérience
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 text-sm text-slate-600 md:pt-6">
              <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-slate-100">
                <span className="h-2 w-2 rounded-full bg-[#0b2e6f]" />
                Mise à jour en temps réel depuis le back-office
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-slate-100">
                <span className="h-2 w-2 rounded-full bg-[#0b2e6f]" />
                Visuels haute définition et animations fluides
              </div>
            </div>
          </div>

          <div className="relative flex-1 md:max-w-xl">
            <div
              ref={heroVisualRef}
              className="hero-visual group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-[0_32px_80px_rgba(15,23,42,0.16)] transition-transform"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-slate-100/70" />
              {heroVisualUrl ? (
                <img
                  src={heroVisualUrl}
                  alt={settings.heroTitle}
                  className="relative z-10 h-auto w-full object-contain drop-shadow-2xl"
                  loading="eager"
                />
              ) : (
                <div className="relative z-10 flex h-80 items-center justify-center bg-gradient-to-br from-[#0b2e6f]/8 via-white to-[#0b2e6f]/5 text-lg font-semibold text-slate-700">
                  Visuel ComptaMatch
                </div>
              )}
              <div className="pointer-events-none absolute -left-10 -top-12 h-48 w-48 rounded-full bg-[#0b2e6f]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <div className="animate-bounce rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 ring-1 ring-slate-200 backdrop-blur">
            Scroll
          </div>
        </div>
      </section>

      <section id="experience" className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="absolute inset-x-8 top-10 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 md:flex-row md:items-start">
          <div className="reveal-on-scroll space-y-4 md:max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Expérience immersive</p>
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Un scroll à la Apple</h2>
            <p className="text-base leading-relaxed text-slate-600">
              Animations synchronisées au scroll, sections qui se dévoilent et transitions douces pour une lecture fluide. Les visuels
              restent nets et optimisés, même sur mobile.
            </p>
            <div className="grid gap-4 pt-2 text-sm text-slate-600">
              <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-slate-100">
                <span className="h-2 w-2 rounded-full bg-[#0b2e6f]" />
                Intersection Observer pour révéler le contenu au bon moment.
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-slate-100">
                <span className="h-2 w-2 rounded-full bg-[#0b2e6f]" />
                Sections épurées, typographie lisible et responsive.
              </div>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 to-[#0b2e6f] p-8 text-white shadow-2xl">
            <div className="reveal-on-scroll space-y-6">
              <h3 className="text-2xl font-semibold">Synchronisé avec votre back-office</h3>
              <p className="text-sm leading-relaxed text-slate-100">
                Les logos, visuels et liens sont chargés dynamiquement depuis vos réglages. La page d'accueil reste alignée avec vos
                campagnes sans repasser par le code.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Logos et visuels</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-50">
                    Hero, sections et cartes supportent des images haute définition en provenance du back-office.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Compatibilité</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-50">
                    Le markup reste accessible sans JavaScript : le contenu reste lisible, même sans animations.
                  </p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -left-24 bottom-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 top-8 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-24">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50 via-white to-white" aria-hidden />
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 md:grid-cols-[1.05fr_0.95fr] md:gap-14">
          <div className="space-y-6">
            <div className="reveal-on-scroll space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sections ancrées</p>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Une histoire en défilement</h2>
              <p className="text-base leading-relaxed text-slate-600">
                Les points forts de ComptaMatch se découvrent au fil du scroll. Chaque bloc déclenche une évolution visuelle qui reste
                épinglée pour un effet premium inspiré des pages macOS.
              </p>
            </div>

            <div className="grid gap-4">
              {storyPoints.map((section, index) => (
                <StoryPoint key={`${section.title}-${index}`} section={section} index={index} onVisible={onStoryVisible} />
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="sticky top-28 overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-[0_32px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-slate-100/60" />
              {storyPoints.map((section, index) => (
                <div
                  key={`${section.illustrationUrl}-${index}`}
                  className={`transition-all duration-700 ease-out ${
                    activePinnedIndex === index ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-4 opacity-0"
                  } absolute inset-0`}
                  aria-hidden={activePinnedIndex !== index}
                >
                  {section.illustrationUrl ? (
                    <img
                      src={section.illustrationUrl}
                      alt={section.title}
                      className="h-full w-full object-contain drop-shadow-2xl"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-[28px] bg-gradient-to-br from-[#0b2e6f]/10 via-white to-slate-100 text-sm font-semibold text-slate-700">
                      Visuel synchronisé ({index + 1})
                    </div>
                  )}
                </div>
              ))}
              <div className="aspect-[4/3]" />
            </div>
          </div>
        </div>
      </section>

      {features.length > 0 && (
        <section className="bg-gradient-to-b from-white via-slate-50 to-white py-20">
          <div className="mx-auto max-w-6xl space-y-10 px-4">
            <div className="reveal-on-scroll space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Fonctionnalités clés</p>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Pensé pour les dirigeants exigeants</h2>
              <p className="text-base text-slate-600 md:text-lg">
                Grille modulaire, responsive, et synchronisée avec les données du back-office pour mettre en avant vos nouveautés.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={`${feature.title}-${feature.iconUrl}`} feature={feature} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-slate-900 py-16 text-white">
        <div className="pointer-events-none absolute -left-24 top-10 h-52 w-52 rounded-full bg-[#0b2e6f]/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal-on-scroll flex flex-col items-start justify-between gap-6 rounded-[32px] bg-white/5 p-8 shadow-xl ring-1 ring-white/10 md:flex-row md:items-center md:p-12">
            <div className="space-y-3 md:max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Prêt à commencer</p>
              <h3 className="text-3xl font-semibold">Page d'accueil premium, compatible back-office</h3>
              <p className="text-base leading-relaxed text-slate-100">
                Une expérience inspirée d'Apple, des animations fluides, et des visuels pilotés par vos réglages. Vos logos et images sont prêts à être intégrés, sans compromis sur la performance ni l'accessibilité.
              </p>
            </div>
            <a
              className="pressable-button inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-1"
              href={settings.heroButtonLink || "/comparatif-des-offres"}
            >
              Lancer ComptaMatch
              <span aria-hidden className="text-[#0b2e6f]">
                →
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
