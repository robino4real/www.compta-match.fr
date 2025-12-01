import { useState } from "react";
import { Link } from "react-router-dom";

type NavLink = {
  label: string;
  href: string;
};

type MainNavbarProps = {
  navLinks?: NavLink[];
  onCartClick?: () => void;
  cartItemCount?: number;
};

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: "Accueil", href: "/" },
  { label: "Comparer les offres", href: "/offres" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Nos logiciels", href: "/nos-logiciels" },
];

export function MainNavbar({
  navLinks = DEFAULT_NAV_LINKS,
  onCartClick,
  cartItemCount = 0,
}: MainNavbarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:py-5">
        {/* Logo à gauche */}
        <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-xs font-semibold text-white">
            CM
          </div>
          <span className="text-sm md:text-base font-semibold text-slate-900 tracking-tight">
            COMPTAMATCH
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex flex-1 items-center justify-center">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm font-medium text-slate-700 hover:text-black transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Zone droite : bouton Mon compte + panier */}
        <div className="hidden md:flex items-center gap-3">
          {/* Bouton connexion / mon compte */}
          <Link
            to="/mon-compte"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition"
          >
            {/* Icône utilisateur simple en SVG */}
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-slate-700"
                aria-hidden="true"
              >
                <circle cx="12" cy="9" r="3.2" />
                <path d="M6.5 18.2c1.4-2 3.1-3 5.5-3s4.1 1 5.5 3" fill="none" />
              </svg>
            </span>
            <span>Mon compte</span>
          </Link>

          {/* Icône panier */}
          <button
            type="button"
            onClick={onCartClick}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition"
            aria-label="Voir le panier"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-slate-800"
              aria-hidden="true"
            >
              <path d="M5 6h2l2 11h8l2-8H9" fill="none" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="17" cy="20" r="1" />
            </svg>

            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Bouton mobile (hamburger) */}
        <button
          type="button"
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200"
          onClick={() => setIsMobileOpen((v) => !v)}
          aria-label={isMobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <span className="block h-[2px] w-4 bg-slate-800 rounded-full" />
          <span className="block h-[2px] w-4 bg-slate-800 rounded-full mt-1" />
        </button>
      </div>

      {/* Menu mobile déroulant */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-3">
            <nav>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="block py-1 text-sm font-medium text-slate-700"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center justify-between pt-2">
              <Link
                to="/mon-compte"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800"
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 text-slate-700"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="9" r="3.2" />
                    <path d="M6.5 18.2c1.4-2 3.1-3 5.5-3s4.1 1 5.5 3" fill="none" />
                  </svg>
                </span>
                <span>Mon compte</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  onCartClick?.();
                  setIsMobileOpen(false);
                }}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white"
                aria-label="Voir le panier"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-slate-800"
                  aria-hidden="true"
                >
                  <path d="M5 6h2l2 11h8l2-8H9" fill="none" />
                  <circle cx="10" cy="20" r="1" />
                  <circle cx="17" cy="20" r="1" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default MainNavbar;
