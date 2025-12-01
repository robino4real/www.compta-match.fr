import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function MainNavbar() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuItems = React.useMemo(
    () => [
      { to: "/", label: "Accueil", exact: true },
      { to: "/comptapro", label: "Comparer les offres" },
      { to: "/tarifs", label: "Tarifs" },
      { to: "/tarifs", label: "Nos logiciels" },
      { to: "/comptapro", label: "ComptaPro" },
      { to: "/contact", label: "Contact" },
    ],
    []
  );

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="w-full border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-xs font-semibold text-white">
            CM
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            COMPTAMATCH
          </span>
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

        {/* Bouton contact / compte */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            to="/contact"
          >
            <span>Contact</span>
          </Link>
          <Link
            className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            to="/compte"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {!isLoading && user?.email ? user.email.charAt(0).toUpperCase() : ""}
            </div>
            <span>Mon compte</span>
          </Link>
        </div>

        {/* Bouton mobile */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 md:hidden"
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
        <div className="border-t border-slate-100 bg-white shadow-sm md:hidden">
          <nav className="grid gap-1 px-4 py-3 text-sm font-medium text-slate-700">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                className="rounded-lg px-2 py-2 hover:bg-slate-50"
                to={item.to}
                aria-label={item.label}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3">
            <Link
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              to="/contact"
            >
              Contact
            </Link>
            <Link
              className="flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
              to="/compte"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                {!isLoading && user?.email ? user.email.charAt(0).toUpperCase() : ""}
              </div>
              <span>Mon compte</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default MainNavbar;
