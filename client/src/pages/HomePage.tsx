import React, { useMemo } from "react";
import { useHomepageSettings } from "../hooks/useHomepageSettings";
import { HomepageContentBlock, HomepageFeature, HomepageHeroSection } from "../types/homepage";

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
    {label}
  </div>
);

const HeroSection: React.FC<{
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaLink?: string;
  visualUrl?: string | null;
  titleTag?: keyof JSX.IntrinsicElements;
  subtitleTag?: keyof JSX.IntrinsicElements;
}> = ({ title, subtitle, ctaLabel, ctaLink, visualUrl, titleTag = "h1", subtitleTag = "p" }) => {
  const TitleTag = titleTag;
  const SubtitleTag = subtitleTag;

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div className="space-y-6">
          <TitleTag className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">{title}</TitleTag>
          <SubtitleTag className="text-lg leading-relaxed text-slate-600 sm:text-xl">{subtitle}</SubtitleTag>
          <div className="flex flex-wrap gap-3">
            {ctaLabel && (
              <a
                href={ctaLink || "#"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
              >
                {ctaLabel}
                <span aria-hidden>→</span>
              </a>
            )}
            <a
              href="#homepage-blocks"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white"
            >
              Découvrir le contenu
            </a>
          </div>
        </div>

        <div className="flex justify-center">
          {visualUrl ? (
            <img
              src={visualUrl}
              alt={title}
              className="max-h-[420px] w-full rounded-2xl bg-white object-contain shadow-sm"
              loading="eager"
            />
          ) : (
            <Placeholder label="Ajoutez un visuel depuis le back-office" />
          )}
        </div>
      </div>
    </section>
  );
};

const FeatureGrid: React.FC<{ block: HomepageContentBlock; features: HomepageFeature[] }> = ({ block, features }) => (
  <section className="bg-white py-16">
    <div className="mx-auto max-w-6xl space-y-8 px-6">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{block.badge || "Fonctionnalités"}</p>
        <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{block.title}</h2>
        {block.body && <p className="text-base text-slate-600 sm:text-lg">{block.body}</p>}
      </div>

      {features.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article key={`${feature.title}-${index}`} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
              {feature.iconUrl && (
                <img src={feature.iconUrl} alt="" className="h-10 w-10 object-contain" loading="lazy" />
              )}
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{feature.text}</p>
            </article>
          ))}
        </div>
      ) : (
        <Placeholder label="Aucune carte configurée pour cette grille" />
      )}
    </div>
  </section>
);

const TwoColumnBlock: React.FC<{
  block: HomepageContentBlock;
  children: React.ReactNode;
  visualUrl?: string;
}> = ({ block, children, visualUrl }) => {
  const imageOnLeft = block.imagePosition === "left";

  return (
    <section className="bg-white py-16" id={block.id}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
        <div className={`${imageOnLeft ? "lg:order-2" : ""} space-y-3`}>
          {block.badge && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{block.badge}</p>}
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{block.title}</h2>
          {block.subtitle && <p className="text-base text-slate-600">{block.subtitle}</p>}
          {block.body && <p className="text-base leading-relaxed text-slate-600">{block.body}</p>}
          {block.bullets && block.bullets.length > 0 && (
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {block.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {(block.buttonLabel || block.buttonLink) && (
            <a
              href={block.buttonLink || "#"}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              {block.buttonLabel || "En savoir plus"}
              <span aria-hidden>→</span>
            </a>
          )}
          {block.mutedText && <p className="text-xs text-slate-500">{block.mutedText}</p>}
        </div>

        <div className={`${imageOnLeft ? "lg:order-1" : ""} flex justify-center`}>
          {visualUrl ? (
            <img src={visualUrl} alt={block.title} className="max-h-96 w-full rounded-2xl border border-slate-100 bg-white object-contain shadow-sm" />
          ) : (
            <Placeholder label="Ajoutez une image à ce bloc" />
          )}
        </div>
      </div>
    </section>
  );
};

const StickyTimeline: React.FC<{ items: HomepageHeroSection[]; visualUrl?: string | null }> = ({ items, visualUrl }) => {
  if (!items.length) return null;

  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[320px,1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Parcours</p>
          <h2 className="text-2xl font-semibold text-slate-900">Sections épinglées</h2>
          <p className="text-sm text-slate-600">
            Ajoutez, réordonnez ou supprimez des étapes depuis le back-office. La page publique s'actualise dès qu'une mise à jour est enregistrée.
          </p>
        </div>
        <div className="space-y-8">
          {items.map((section, index) => (
            <article key={`${section.title}-${index}`} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                <p className="text-sm text-slate-600">{section.subtitle}</p>
                {(section.buttonLabel || section.buttonLink) && (
                  <a href={section.buttonLink || "#"} className="text-sm font-semibold text-slate-900 underline">
                    {section.buttonLabel || "Découvrir"}
                  </a>
                )}
              </div>
              <div className="min-w-[180px] lg:max-w-xs">
                {(section.illustrationUrl || visualUrl) ? (
                  <img
                    src={section.illustrationUrl || visualUrl || ""}
                    alt={section.title}
                    className="h-28 w-full rounded-xl border border-slate-100 object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
                    Illustration optionnelle
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const renderContentBlock = (
  block: HomepageContentBlock,
  features: HomepageFeature[],
  heroVisualUrl: string,
): React.ReactNode => {
  switch (block.kind) {
    case "feature-grid":
      return <FeatureGrid key={block.id} block={block} features={features} />;
    case "identity":
    case "experience":
    case "story":
    case "cta":
    default:
      return (
        <TwoColumnBlock key={block.id} block={block} visualUrl={block.imageUrl || heroVisualUrl}>
          {null}
        </TwoColumnBlock>
      );
  }
};

const HomePage: React.FC = () => {
  const { settings, isLoading, error } = useHomepageSettings();

  const heroVisualUrl = useMemo(
    () =>
      settings.heroIllustrationUrl ||
      settings.heroImageUrl ||
      settings.heroBackgroundImageUrl ||
      settings.navbarLogoUrl ||
      "",
    [settings.heroIllustrationUrl, settings.heroImageUrl, settings.heroBackgroundImageUrl, settings.navbarLogoUrl],
  );

  const hasBlocks = settings.blocks && settings.blocks.length > 0;

  if (isLoading && !settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Chargement…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-3 text-center">
          <p className="text-base font-semibold text-slate-900">Impossible de charger la page d'accueil</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 text-slate-900">
      <HeroSection
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        ctaLabel={settings.heroButtonLabel}
        ctaLink={settings.heroButtonLink}
        visualUrl={heroVisualUrl}
        titleTag={(settings.heroTitleTag || "h1") as keyof JSX.IntrinsicElements}
        subtitleTag={(settings.heroSubtitleTag || "p") as keyof JSX.IntrinsicElements}
      />

      <StickyTimeline items={settings.heroSections || []} visualUrl={heroVisualUrl} />

      <div id="homepage-blocks">
        {hasBlocks ? (
          settings.blocks.map((block) => renderContentBlock(block, settings.features || [], heroVisualUrl))
        ) : (
          <section className="bg-white py-16">
            <div className="mx-auto max-w-4xl space-y-4 px-6 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">Aucune section configurée</h2>
              <p className="text-sm text-slate-600">
                Créez vos blocs depuis le back-office pour structurer librement la page d'accueil. Les changements sont diffusés en temps réel dès qu'ils sont enregistrés.
              </p>
              <div className="flex items-center justify-center">
                <a
                  href="/admin/homepage"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
                >
                  Ouvrir le back-office
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default HomePage;
