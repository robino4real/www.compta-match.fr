import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { DownloadableProductsSection } from "../components/downloadable-products/DownloadableProductsSection";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function DownloadableProductsPage() {
  const navigate = useNavigate();
  const { items, lastAdditionTimestamp } = useCart();
  const { user, isLoading } = useAuth();
  const [isCartBouncing, setIsCartBouncing] = React.useState(false);

  React.useEffect(() => {
    if (!lastAdditionTimestamp) return;

    setIsCartBouncing(true);
    const timeout = window.setTimeout(() => setIsCartBouncing(false), 600);

    return () => window.clearTimeout(timeout);
  }, [lastAdditionTimestamp]);

  const handleBackClick = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const authButtonLabel = user ? "Mon compte" : "Se connecter";
  const authButtonTarget = user ? "/compte" : "/auth/login";
  const userInitial = !isLoading && user?.email ? user.email.charAt(0).toUpperCase() : null;

  return (
    <main className="hero-logiciels relative min-h-screen bg-[#04140c] text-white">
      <div className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-14 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="relative flex w-full items-center justify-center">
          <button
            type="button"
            onClick={handleBackClick}
            className="hero-back-button absolute left-0 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/15 text-base font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-2.5"
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
            <span className="sr-only">Retour</span>
            <span className="hidden sm:inline">Retour</span>
          </button>

          <div className="fixed right-[1cm] top-[clamp(1.25rem,3vw,2.5rem)] z-30 flex items-center gap-3">
            <Link
              to={authButtonTarget}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/15 text-base font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-2.5"
              aria-label={authButtonLabel}
            >
              {userInitial ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg font-semibold text-white sm:h-8 sm:w-8">
                  {userInitial}
                </span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6 sm:hidden"
                >
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              )}
              <span className="sr-only">{authButtonLabel}</span>
              <span className="hidden sm:inline">{authButtonLabel}</span>
            </Link>
            <Link
              to="/panier"
              className={`relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/15 text-base font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300${
                isCartBouncing ? " cart-icon-bounce" : ""
              }`}
              aria-label="Panier"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 12.39a1 1 0 0 0 .98.8h8.72a1 1 0 0 0 .98-.8L21 6H6" strokeWidth={2} />
              </svg>
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-semibold text-white">
                  {items.length}
                </span>
              )}
            </Link>
          </div>

          <span className="pointer-events-none text-center text-lg font-semibold tracking-tight text-white drop-shadow md:text-2xl">
            COMPTAMATCH
          </span>
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

        <DownloadableProductsSection />
      </div>
    </main>
  );
}
