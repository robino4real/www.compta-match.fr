import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface DiscoveryCard {
  title: string;
  description: string;
  highlight?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const cards: DiscoveryCard[] = [
  {
    title: "Nos logiciels",
    description:
      "Téléchargez et installez nos solutions prêtes à l'emploi pour accélérer votre tenue et vos clôtures comptables.",
    highlight: "Téléchargements",
    primaryCta: { label: "Découvrir", href: "/logiciels" },
  },
  {
    title: "L'abonnement ComptaPro",
    description:
      "Pilotez la comptabilité de vos entreprises avec une web app sécurisée, collaborative et connectée à vos banques.",
    highlight: "Entreprises",
    primaryCta: { label: "Essayer gratuitement", href: "/mon-espace-pro" },
    secondaryCta: { label: "Découvrir l'offre", href: "/comptapro" },
  },
  {
    title: "L'abonnement ComptAsso",
    description:
      "Offrez à vos bénévoles un suivi clair des dépenses, remboursements et budgets grâce à notre espace associatif.",
    highlight: "Associations",
    primaryCta: { label: "Essayer gratuitement", href: "/mon-espace-asso" },
    secondaryCta: { label: "Découvrir l'offre", href: "/comptasso" },
  },
];

const backButtonClasses =
  "hero-back-button inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/15 text-base font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-2.5";

const cardClasses =
  "relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/10 p-6 shadow-xl backdrop-blur-lg transition hover:-translate-y-1 hover:border-white/60 hover:bg-white/20";

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  const handleBackClick = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handlePrimaryCta = React.useCallback(
    (href: string) => {
      if ((href === "/mon-espace-pro" || href === "/mon-espace-asso") && !user && !isAuthLoading) {
        navigate("/auth/register");
        return;
      }

      navigate(href);
    },
    [isAuthLoading, navigate, user]
  );

  return (
    <main className="hero-decouverte relative min-h-screen overflow-hidden bg-[#0a1430] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(96,165,250,0.15),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.12),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(125,211,252,0.15),transparent_45%)]" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-14 lg:px-10 lg:pb-20 lg:pt-16">
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
          <div className="relative max-w-3xl space-y-4">
            <span className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 rounded-[32px] bg-gradient-to-r from-sky-400/30 via-blue-900/30 to-cyan-300/25 blur-3xl" />
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white drop-shadow md:text-5xl">DECOUVERTE</h1>
            <p className="text-base text-blue-50/90 md:text-lg">
              Retrouvez en un coup d'œil nos trois parcours : téléchargement des logiciels, abonnement ComptaPro et abonnement ComptAsso.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className={cardClasses}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent" aria-hidden />
              <div className="relative flex flex-col gap-4">
                {card.highlight && (
                  <span className="inline-flex w-fit items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                    {card.highlight}
                  </span>
                )}
                <h2 className="text-2xl font-semibold text-white">{card.title}</h2>
                <p className="text-sm leading-relaxed text-blue-50/90">{card.description}</p>
              </div>

              <div className="relative mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handlePrimaryCta(card.primaryCta.href)}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-white/80 px-4 py-3 text-sm font-semibold text-[#0a1430] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {card.primaryCta.label}
                </button>
                {card.secondaryCta && (
                  <Link
                    to={card.secondaryCta.href}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20"
                  >
                    {card.secondaryCta.label}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default DiscoveryPage;
