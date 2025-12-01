import React from "react";
import StructuredDataScript from "../components/StructuredDataScript";
import { FeatureCardsRow } from "../components/home/FeatureCardsRow";
import { HeroSection } from "../components/home/HeroSection";
import { MainNavbar } from "../components/home/MainNavbar";
import { layout } from "../design/tokens";
import { useHomepageContent } from "../hooks/useHomepageContent";
import { useCustomPage } from "../hooks/useCustomPage";
import PageRenderer from "../components/pageBuilder/PageRenderer";

const HomePage: React.FC = () => {
  const { settings, isLoading, error } = useHomepageContent();
  const { data: builderData, isLoading: isBuilderLoading, error: builderError } = useCustomPage("/");

  const shouldRenderBuilder =
    builderData && Array.isArray(builderData.sections) && builderData.sections.length > 0;

  React.useEffect(() => {
    document.title = settings.heroTitle || "ComptaMatch";
  }, [settings.heroTitle]);

  if (isLoading || (isBuilderLoading && !shouldRenderBuilder)) {
    return (
      <main className={`min-h-screen ${layout.pageBackground} flex items-center justify-center`}>
        <p className="text-sm text-slate-500">Chargement…</p>
      </main>
    );
  }

  if (builderError) {
    console.warn("Page builder indisponible", builderError);
  }

  if (error && !settings) {
    return (
      <main className={`min-h-screen ${layout.pageBackground} flex items-center justify-center px-4`}>
        <div className="max-w-lg bg-white rounded-3xl shadow-lg px-8 py-10 text-center">
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  if (shouldRenderBuilder) {
    return (
      <div className="space-y-8 text-slate-900">
        <PageRenderer page={builderData!.page} sections={builderData!.sections} />
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${layout.pageBackground}`}>
      <StructuredDataScript data={null} />
      <MainNavbar
        logoText={settings.logoText}
        logoSquareText={settings.logoSquareText}
        navLinks={settings.navLinks}
        primaryNavButton={settings.primaryNavButton}
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:pt-16">
        <HeroSection
          title={settings.heroTitle}
          subtitle={settings.heroSubtitle}
          ctaHref={settings.heroPrimaryCtaHref}
          ctaLabel={settings.heroPrimaryCtaLabel}
          illustrationUrl={settings.heroIllustrationUrl}
        />

        <FeatureCardsRow cards={settings.featureCards} />
      </div>
    </main>
  );
};

export default HomePage;
