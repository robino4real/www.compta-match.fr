import React from "react";
import { useHomepageSettings } from "../hooks/useHomepageSettings";
import { HomepageFeature, HomepageHeroSection } from "../types/homepage";

const FeatureCard: React.FC<{ feature: HomepageFeature }> = ({ feature }) => (
  <div className="rounded-3xl border border-slate-100 bg-white px-6 py-6 shadow-sm">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200">
      {feature.iconUrl ? (
        <img src={feature.iconUrl} alt={feature.title} className="h-8 w-8 object-contain" />
      ) : (
        <span className="text-sm">★</span>
      )}
    </div>
    <h3 className="mb-2 text-base font-semibold text-slate-900">{feature.title}</h3>
    <p className="text-sm text-slate-600">{feature.text}</p>
  </div>
);

const HeroBlock: React.FC<{
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
  illustrationUrl: string;
  align?: "left" | "right";
  TitleTag?: keyof JSX.IntrinsicElements;
  SubtitleTag?: keyof JSX.IntrinsicElements;
}> = ({ title, subtitle, buttonLabel, buttonLink, illustrationUrl, align = "left", TitleTag = "h1", SubtitleTag = "p" }) => {
  const isTextLeft = align !== "right";

  return (
    <section
      className={`mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:items-center md:py-20 ${
        isTextLeft ? "" : "md:flex-row-reverse"
      }`}
    >
      <div className="max-w-xl space-y-6">
        <TitleTag className="text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">{title}</TitleTag>
        <SubtitleTag className="text-sm leading-relaxed text-slate-600 md:text-base">{subtitle}</SubtitleTag>
        <a
          className="inline-flex items-center justify-center rounded-full bg-[#0b2e6f] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0a275d]"
            href={buttonLink || "/comparatif-des-offres"}
        >
          {buttonLabel}
        </a>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative flex w-full max-w-md items-center justify-center">
          <img src={illustrationUrl} alt="Illustration comptable" className="h-auto w-full object-contain" />
        </div>
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const { settings, isLoading } = useHomepageSettings();

  const TitleTag = (settings.heroTitleTag || "h1") as keyof JSX.IntrinsicElements;
  const SubtitleTag = (settings.heroSubtitleTag || "p") as keyof JSX.IntrinsicElements;
  const heroSections = settings.heroSections || [];
  const features = settings.features || [];

  if (isLoading && !settings) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-slate-500">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <HeroBlock
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        buttonLabel={settings.heroButtonLabel}
        buttonLink={settings.heroButtonLink}
        illustrationUrl={settings.heroIllustrationUrl}
        align="left"
        TitleTag={TitleTag}
        SubtitleTag={SubtitleTag}
      />

      {heroSections.map((section: HomepageHeroSection, index: number) => (
        <HeroBlock
          key={`${section.title}-${index}`}
          title={section.title}
          subtitle={section.subtitle}
          buttonLabel={section.buttonLabel || settings.heroButtonLabel}
          buttonLink={section.buttonLink || settings.heroButtonLink}
          illustrationUrl={section.illustrationUrl || settings.heroIllustrationUrl}
          align={section.align || (index % 2 === 0 ? "right" : "left")}
          TitleTag={TitleTag}
          SubtitleTag={SubtitleTag}
        />
      ))}

      {features.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3 md:py-14">
            {features.map((feature) => (
              <FeatureCard key={`${feature.title}-${feature.iconUrl}`} feature={feature} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default HomePage;
