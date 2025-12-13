import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import DownloadableProductsSection from "../components/downloadable-products/DownloadableProductsSection";

export default function DownloadableProductsPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { items } = useCart();

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
        <div className="relative flex w-full items-center justify-center">
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

          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center text-lg font-semibold tracking-tight text-white drop-shadow md:text-2xl">
            COMPTAMATCH
          </span>

          <div className="absolute right-0 flex items-center gap-2 md:gap-3">
            <Link
              to={user ? "/compte" : "/auth/login"}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-xs font-semibold text-slate-900">
                {!isLoading && user?.email ? (
                  user.email.charAt(0).toUpperCase()
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-4 w-4"
                  >
                    <circle cx="12" cy="8" r="3.25" />
                    <path d="M6.5 18.5c0-2.35 2.7-4 5.5-4s5.5 1.65 5.5 4" />
                  </svg>
                )}
              </span>
              <span>{user ? "Mon compte" : "Se connecter"}</span>
            </Link>

            <Link
              to="/panier"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              aria-label="Panier"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 12.39a1 1 0 0 0 .98.8h8.72a1 1 0 0 0 .98-.8L21 6H6" strokeWidth={1.6} />
              </svg>
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                  {items.length}
                </span>
              )}
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
