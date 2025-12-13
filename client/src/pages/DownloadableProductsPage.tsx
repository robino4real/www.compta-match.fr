import React from "react";
import { Link, useNavigate } from "react-router-dom";
import DownloadableProductsSection from "../components/downloadable-products/DownloadableProductsSection";

export default function DownloadableProductsPage() {
  const navigate = useNavigate();

  const handleBackClick = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  return (
    <main className="hero-logiciels min-h-screen bg-[#04140c] text-white">
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-14 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="relative flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackClick}
            className="hero-back-button inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/15 px-5 py-2.5 text-base font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
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
            <span>Retour</span>
          </button>

          <span className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold tracking-tight text-white drop-shadow md:text-2xl">
            COMPTAMATCH
          </span>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/panier"
              className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 md:px-5 md:py-2.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  d="M6 6h15l-1.5 9h-11z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
                <path d="M6 6 4 3H2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Panier</span>
            </Link>

            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 md:px-5 md:py-2.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Se connecter</span>
            </Link>
          </div>
        </div>

        <section className="flex flex-col items-center gap-6 text-center">
          <div className="relative space-y-4">
            <span className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 rounded-[32px] bg-gradient-to-r from-emerald-500/20 via-green-800/30 to-emerald-400/20 blur-3xl" />
            <h1 className="text-4xl font-bold leading-tight text-white drop-shadow md:text-5xl">
              Logiciels de comptabilité
              <span className="block text-white/80 text-xl md:text-2xl">Téléchargez, installez, simplifiez</span>
            </h1>
            <p className="text-base text-emerald-50/90 md:text-lg">
              Une sélection de solutions prêtes à l’emploi pour accélérer votre comptabilité dès aujourd’hui.
            </p>
          </div>
        </section>

        <div className="overflow-hidden rounded-[32px] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-2xl md:p-6">
          <DownloadableProductsSection />
        </div>
      </div>
    </main>
  );
}
