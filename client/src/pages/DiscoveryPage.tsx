import React from "react";
import { Link, NavigateFunction, useNavigate } from "react-router-dom";

interface DestinationCard {
  title: string;
  description: string;
  href: string;
  tag?: string;
}

const destinations: DestinationCard[] = [
  {
    title: "Logiciels", 
    description:
      "Téléchargez et installez nos solutions prêtes à l'emploi pour fluidifier votre gestion comptable au quotidien.",
    href: "/logiciels",
    tag: "Téléchargements",
  },
  {
    title: "ComptAsso",
    description:
      "Découvrez l'abonnement dédié aux associations avec des outils simples, collaboratifs et adaptés à vos équipes bénévoles.",
    href: "/comptasso",
    tag: "Associations",
  },
  {
    title: "ComptaPro",
    description:
      "Pilotez la comptabilité de votre entreprise avec notre offre en ligne : automatisation bancaire, contrôle et reporting.",
    href: "/comptapro",
    tag: "Entreprises",
  },
];

const backButtonClasses =
  "hero-back-button inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/15 text-base font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-2.5";

const cardClasses =
  "relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/10 p-6 shadow-xl backdrop-blur-lg transition hover:-translate-y-1 hover:border-white/60 hover:bg-white/15";

const DiscoveryPage: React.FC = () => {
  const navigate: NavigateFunction = useNavigate();

  const handleBackClick = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  return (
    <main className="hero-logiciels relative min-h-screen bg-[#04140c] text-white">
      <div className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-14 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="relative flex w-full items-center justify-center">
          <button type="button" onClick={handleBackClick} className={`${backButtonClasses} absolute left-0`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="sr-only">Retour</span>
            <span className="hidden sm:inline">Retour</span>
          </button>

          <span className="pointer-events-none text-center text-lg font-semibold tracking-tight text-white drop-shadow md:text-2xl">
            COMPTAMATCH
          </span>
        </div>

        <section className="flex flex-col items-center gap-6 text-center">
          <div className="relative space-y-4 max-w-3xl">
            <span className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 rounded-[32px] bg-gradient-to-r from-emerald-500/25 via-green-800/30 to-emerald-400/25 blur-3xl" />
            <h1 className="text-4xl font-bold leading-tight text-white drop-shadow md:text-5xl">
              Découvrez nos univers
              <span className="block text-white/80 text-xl md:text-2xl">Logiciels, ComptAsso et ComptaPro</span>
            </h1>
            <p className="text-base text-emerald-50/90 md:text-lg">
              Explorez rapidement les trois expériences ComptaMatch et accédez à celle qui correspond le mieux à votre besoin.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {destinations.map((destination) => (
            <article key={destination.href} className={cardClasses}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent" aria-hidden />
              <div className="relative flex flex-col gap-4">
                {destination.tag && (
                  <span className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                    {destination.tag}
                  </span>
                )}
                <h2 className="text-2xl font-semibold text-white">{destination.title}</h2>
                <p className="text-sm leading-relaxed text-emerald-50/90">{destination.description}</p>
              </div>

              <div className="relative mt-8 flex items-end">
                <Link
                  to={destination.href}
                  className="inline-flex w-full items-center justify-center rounded-full bg-white/20 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                >
                  Accéder
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default DiscoveryPage;
