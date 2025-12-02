import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHomepageSettings } from "../hooks/useHomepageSettings";
import { HomepageContentBlock, HomepageFeature, HomepageHeroSection } from "../types/homepage";

const ScrollRevealSection: React.FC<{
  enabled?: boolean;
  className?: string;
  children: React.ReactNode;
  id?: string;
}> = ({ enabled, className, children, id }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <section
      ref={ref}
      id={id}
      className={`transition duration-700 ease-out ${className ?? ""} ${
        enabled ? "translate-y-8 opacity-0" : ""
      } ${isVisible ? "translate-y-0 opacity-100" : ""}`}
    >
      {children}
    </section>
  );
};

const TwoColumnSection: React.FC<{
  block: HomepageContentBlock;
  visual: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}> = ({ block, visual, children, id }) => {
  const imageOnLeft = block.imagePosition === "left";
  const textOrder = imageOnLeft ? "md:order-2" : "md:order-1";
  const visualOrder = imageOnLeft ? "md:order-1" : "md:order-2";

  return (
    <ScrollRevealSection enabled={block.revealAnimation} className="bg-white py-16" id={id}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
        <div className={`space-y-4 ${textOrder}`}>{children}</div>
        <div className={`flex justify-center ${visualOrder}`}>{visual}</div>
      </div>
    </ScrollRevealSection>
  );
};

const FeatureCard: React.FC<{ feature: HomepageFeature }> = ({ feature }) => (
  <article className="space-y-2">
    {feature.iconUrl && (
      <img src={feature.iconUrl} alt={feature.title} className="h-12 w-12 object-contain" loading="lazy" />
    )}
    <h3 className="text-lg font-semibold text-black">{feature.title}</h3>
    <p className="text-sm leading-relaxed text-black/70">{feature.text}</p>
  </article>
);

const IdentitySection: React.FC<{
  block: HomepageContentBlock;
  heroVisualUrl: string;
}> = ({ block, heroVisualUrl }) => {
  const visualUrl = block.imageUrl || heroVisualUrl;
  const visual = visualUrl ? (
    <img src={visualUrl} alt={block.title} className="max-h-96 w-full object-contain" loading="lazy" />
  ) : (
    <div className="flex h-72 w-full items-center justify-center bg-black/5 text-sm text-black/60">
      Ajoutez une image pour ce bloc
    </div>
  );

  return (
    <TwoColumnSection block={block} visual={visual}>
      <h2 className="text-3xl font-semibold text-black md:text-4xl">{block.title}</h2>
      {(block.subtitle || block.body) && (
        <p className="text-base leading-relaxed text-black/70">{block.subtitle || block.body}</p>
      )}
    </TwoColumnSection>
  );
};

const ExperienceSection: React.FC<{ block: HomepageContentBlock; heroVisualUrl: string }> = ({ block, heroVisualUrl }) => {
  const visualUrl = block.imageUrl || heroVisualUrl;
  const visual = visualUrl ? (
    <img src={visualUrl} alt={block.title} className="max-h-96 w-full object-contain" loading="lazy" />
  ) : (
    <div className="flex h-72 w-full items-center justify-center bg-black/5 text-sm text-black/60">
      Ajoutez une image pour ce bloc
    </div>
  );

  return (
    <TwoColumnSection block={block} visual={visual} id="experience">
      <h2 className="text-3xl font-semibold text-black md:text-4xl">{block.title}</h2>
      {(block.subtitle || block.body) && (
        <p className="text-base leading-relaxed text-black/70">{block.subtitle || block.body}</p>
      )}
    </TwoColumnSection>
  );
};

const StorySection: React.FC<{
  block: HomepageContentBlock;
  storyPoints: HomepageHeroSection[];
  heroVisualUrl: string;
}> = ({ block, storyPoints, heroVisualUrl }) => {
  const illustration = storyPoints[0]?.illustrationUrl || heroVisualUrl;
  const text = block.body || block.subtitle || storyPoints[0]?.subtitle;
  const title = block.title || storyPoints[0]?.title;

  return (
    <TwoColumnSection
      block={block}
      visual={
        illustration ? (
          <img src={illustration} alt={title} className="max-h-96 w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-black/5 text-sm text-black/60">
            Visuel synchronisé
          </div>
        )
      }
    >
      <h2 className="text-3xl font-semibold text-black md:text-4xl">{title}</h2>
      {text && <p className="text-base leading-relaxed text-black/70">{text}</p>}
    </TwoColumnSection>
  );
};

const FeatureGridSection: React.FC<{
  block: HomepageContentBlock;
  features: HomepageFeature[];
}> = ({ block, features }) => (
  <ScrollRevealSection enabled={block.revealAnimation} className="bg-white py-16">
    <div className="mx-auto max-w-6xl space-y-8 px-4">
      <div className="space-y-3 text-center">
        <h2 className="text-3xl font-semibold text-black md:text-4xl">{block.title}</h2>
        {block.body && <p className="text-base text-black/70 md:text-lg">{block.body}</p>}
      </div>

      {features.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={`${feature.title}-${feature.iconUrl}`} feature={feature} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center bg-black/5 px-4 py-10 text-sm text-black/60">
          Configurez vos cartes de mise en avant dans le back-office pour remplir cette grille.
        </div>
      )}
    </div>
  </ScrollRevealSection>
);

const HomePage: React.FC = () => {
  const { settings, isLoading } = useHomepageSettings();

  const TitleTag = (settings.heroTitleTag || "h1") as keyof JSX.IntrinsicElements;
  const SubtitleTag = (settings.heroSubtitleTag || "p") as keyof JSX.IntrinsicElements;
  const heroSections = settings.heroSections || [];
  const features = settings.features || [];

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
    ];
  }, [heroSections, heroVisualUrl, settings.heroButtonLabel, settings.heroButtonLink]);

  const blocks: HomepageContentBlock[] = settings.blocks && settings.blocks.length ? settings.blocks : [];

  const renderBlock = (block: HomepageContentBlock) => {
    switch (block.kind) {
      case "identity":
        return (
          <IdentitySection
            key={block.id}
            block={block}
            heroVisualUrl={heroVisualUrl}
          />
        );
      case "experience":
        return <ExperienceSection key={block.id} block={block} heroVisualUrl={heroVisualUrl} />;
      case "story":
        return <StorySection key={block.id} block={block} storyPoints={storyPoints} heroVisualUrl={heroVisualUrl} />;
      case "feature-grid":
        return <FeatureGridSection key={block.id} block={block} features={features} />;
      default:
        return null;
    }
  };

  if (isLoading && !settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-black/70">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="bg-white text-black">
      <section className="relative flex min-h-screen items-center bg-white">
        <div className="absolute inset-0" aria-hidden />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-16 md:flex-row md:items-center md:gap-12 md:py-20">
          <div className="max-w-xl space-y-6">
            <TitleTag className="text-4xl font-semibold leading-tight text-black md:text-5xl">{settings.heroTitle}</TitleTag>
            <SubtitleTag className="text-lg leading-relaxed text-black/70 md:text-xl">{settings.heroSubtitle}</SubtitleTag>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-1"
                href={settings.heroButtonLink || "/comparatif-des-offres"}
              >
                {settings.heroButtonLabel || "Découvrir nos offres"}
                <span aria-hidden>→</span>
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-full border border-black px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-1"
                href="#experience"
              >
                Voir l'expérience
              </a>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center">
            {heroVisualUrl ? (
              <img
                src={heroVisualUrl}
                alt={settings.heroTitle}
                className="max-h-[480px] w-full object-contain"
                loading="eager"
              />
            ) : (
              <div className="flex h-80 w-full items-center justify-center bg-black/5 text-lg font-semibold text-black/70">
                Visuel ComptaMatch
              </div>
            )}
          </div>
        </div>
      </section>

      {blocks.map(renderBlock)}
    </main>
  );
};

export default HomePage;
