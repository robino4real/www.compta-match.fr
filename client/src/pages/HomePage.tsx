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

type HeroSlide = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
  illustrationUrl: string;
  align?: "left" | "right";
};

const HeroSlideView: React.FC<{
  slide: HeroSlide;
  TitleTag: keyof JSX.IntrinsicElements;
  SubtitleTag: keyof JSX.IntrinsicElements;
  isActive: boolean;
  isPrevious: boolean;
  isLastSlide: boolean;
}> = ({ slide, TitleTag, SubtitleTag, isActive, isPrevious, isLastSlide }) => {
  const isTextLeft = slide.align !== "right";
  const shouldRender = isActive || isPrevious;

  if (!shouldRender) return null;

  return (
    <section
      className={`absolute inset-0 flex h-full w-full items-center justify-center px-4 py-14 transition-opacity duration-700 ease-out md:px-10 ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!isActive}
    >
      <div
        className={`relative mx-auto flex h-full max-w-6xl flex-col gap-12 overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-slate-50 to-white px-6 py-10 shadow-[0_24px_60px_rgba(15,23,42,0.1)] md:flex-row md:items-center md:px-12 ${
          isTextLeft ? "" : "md:flex-row-reverse"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-50/70 via-white/80 to-slate-50/50" />

        <div className="relative z-10 flex-1">
          <div
            className={`space-y-5 transition-all duration-700 ease-out ${
              isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Compta Match</p>
            <TitleTag className="text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
              {slide.title}
            </TitleTag>
            <SubtitleTag className="max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
              {slide.subtitle}
            </SubtitleTag>

            {isLastSlide && (
              <div className="pt-2">
                <a
                  className="inline-flex items-center justify-center rounded-full bg-[#0b2e6f] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0a275d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b2e6f]"
                  href={slide.buttonLink || "/comparatif-des-offres"}
                >
                  {slide.buttonLabel || "Découvrir nos offres"}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div
            className={`relative w-full max-w-xl overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-100 via-white to-slate-50 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition-all duration-700 ease-out ${
              isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-slate-100/70" />
            <img
              src={slide.illustrationUrl}
              alt={slide.title}
              className="relative z-10 h-auto w-full object-contain"
              loading="lazy"
            />
          </div>
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

  const slides: HeroSlide[] = React.useMemo(() => {
    const baseSlide: HeroSlide = {
      title: settings.heroTitle,
      subtitle: settings.heroSubtitle,
      buttonLabel: settings.heroButtonLabel,
      buttonLink: settings.heroButtonLink,
      illustrationUrl: settings.heroIllustrationUrl,
      align: "left",
    };

    const additionalSlides = heroSections.map((section: HomepageHeroSection, index: number) => ({
      title: section.title || settings.heroTitle,
      subtitle: section.subtitle || settings.heroSubtitle,
      buttonLabel: section.buttonLabel || settings.heroButtonLabel,
      buttonLink: section.buttonLink || settings.heroButtonLink,
      illustrationUrl: section.illustrationUrl || settings.heroIllustrationUrl,
      align: section.align || ((index + 1) % 2 === 0 ? "right" : "left"),
    }));

    return [baseSlide, ...additionalSlides];
  }, [heroSections, settings.heroButtonLabel, settings.heroButtonLink, settings.heroIllustrationUrl, settings.heroSubtitle, settings.heroTitle]);

  const totalSlides = slides.length;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [previousIndex, setPreviousIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const touchStartY = React.useRef<number | null>(null);

  React.useEffect(() => {
    setCurrentIndex(0);
    setPreviousIndex(0);
    setIsTransitioning(false);
  }, [totalSlides]);

  const goToSlide = React.useCallback(
    (nextIndex: number) => {
      if (isTransitioning || nextIndex === currentIndex) return;
      if (nextIndex < 0 || nextIndex >= totalSlides) return;

      setIsTransitioning(true);
      setPreviousIndex(currentIndex);
      setCurrentIndex(nextIndex);

      window.setTimeout(() => {
        setIsTransitioning(false);
      }, 750);
    },
    [currentIndex, isTransitioning, totalSlides],
  );

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 24) return;
    if (isTransitioning) return;

    if (event.deltaY > 0) {
      goToSlide(currentIndex + 1);
    } else {
      goToSlide(currentIndex - 1);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || isTransitioning) return;
    const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY.current;
    const deltaY = touchStartY.current - touchEndY;

    if (Math.abs(deltaY) < 45) return;

    if (deltaY > 0) {
      goToSlide(currentIndex + 1);
    } else {
      goToSlide(currentIndex - 1);
    }
  };

  if (isLoading && !settings) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-slate-500">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <section
        className="relative min-h-screen overflow-hidden"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-slate-50 to-white" />

        <div className="relative mx-auto flex h-screen max-w-7xl items-center justify-center">
          {slides.map((slide, index) => (
            <HeroSlideView
              key={`${slide.title}-${index}`}
              slide={slide}
              TitleTag={TitleTag}
              SubtitleTag={SubtitleTag}
              isActive={index === currentIndex}
              isPrevious={index === previousIndex && index !== currentIndex}
              isLastSlide={index === totalSlides - 1}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />

        {totalSlides > 1 && (
          <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 md:bottom-12">
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-lg ring-1 ring-slate-200 backdrop-blur">
              {slides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "w-7 bg-[#0b2e6f]" : "bg-slate-300"
                  }`}
                  aria-label={`Aller à la diapositive ${index + 1}`}
                />
              ))}
            </div>

            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 shadow ring-1 ring-slate-200 backdrop-blur">
              Slide {currentIndex + 1}/{totalSlides}
            </span>
          </div>
        )}
      </section>

      {features.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl space-y-8 px-4 py-14">
            <div className="space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Fonctionnalités clés</p>
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">Tout ce qu'il faut pour avancer sereinement</h2>
              <p className="text-sm text-slate-600 md:text-base">
                Une sélection des points forts de Compta Match pour accompagner chaque étape de votre comptabilité.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={`${feature.title}-${feature.iconUrl}`} feature={feature} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default HomePage;
