import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export function MainNavbar() {
  const { user, isLoading } = useAuth();
  const { items, lastAdditionTimestamp } = useCart();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCartBouncing, setIsCartBouncing] = React.useState(false);
  const navbarLogoUrl = "/images/logo.png";

  const menuItems = React.useMemo(
    () => [
      { to: "/", label: "Accueil", exact: true },
      { to: "/comparatif-des-offres", label: "Comparer les offres" },
      { to: "/logiciels", label: "Nos logiciels" },
      { to: "/comptapro", label: "ComptaPro" },
    ],
    []
  );

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!lastAdditionTimestamp) return;

    setIsCartBouncing(true);
    const timeout = window.setTimeout(() => setIsCartBouncing(false), 600);

    return () => window.clearTimeout(timeout);
  }, [lastAdditionTimestamp]);

  const cartLinkClasses =
    "relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-800 transition hover:border-slate-300 hover:bg-white" +
    (isCartBouncing ? " cart-icon-bounce" : "");

  return (
    <header className="w-full bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-0 md:py-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
            COMPTAMATCH
          </span>
          <img
            src={navbarLogoUrl}
            alt="Logo ComptaMatch"
            className="h-24 w-auto md:h-28"
          />
        </Link>

        {/* Menu principal */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              className={`hover:text-slate-900 ${
                item.exact && location.pathname === item.to
                  ? "text-slate-900"
                  : ""
              }`}
              to={item.to}
              aria-label={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bouton connexion + panier */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            to={user ? "/compte" : "/auth/login"}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-xs font-semibold text-slate-900">
              {!isLoading && user?.email ? (
                user.email.charAt(0).toUpperCase()
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="8" r="3.25" />
                  <path d="M6.5 18.5c0-2.35 2.7-4 5.5-4s5.5 1.65 5.5 4" />
                </svg>
              )}
            </div>
            <span>{user ? "Mon compte" : "Se connecter"}</span>
          </Link>
          <Link className={cartLinkClasses} to="/panier" aria-label="Panier">
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

        {/* Bouton mobile */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-700 transition hover:bg-white md:hidden"
          aria-label="Ouvrir le menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                isMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
              }
            />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="bg-white shadow-sm md:hidden">
          <nav className="grid gap-1 px-4 py-3 text-sm font-medium text-slate-700">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                className="rounded-lg px-2 py-2 hover:bg-white"
                to={item.to}
                aria-label={item.label}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              to={user ? "/compte" : "/auth/login"}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-xs font-semibold text-slate-900">
                {!isLoading && user?.email ? (
                  user.email.charAt(0).toUpperCase()
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    className="h-4 w-4"
                  >
                    <circle cx="12" cy="8" r="3.25" />
                    <path d="M6.5 18.5c0-2.35 2.7-4 5.5-4s5.5 1.65 5.5 4" />
                  </svg>
                )}
              </div>
              <span>{user ? "Mon compte" : "Se connecter"}</span>
            </Link>
            <Link
              className={cartLinkClasses}
              to="/panier"
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
      )}
    </header>
  );
}

export default MainNavbar;
