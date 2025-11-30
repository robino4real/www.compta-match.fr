import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import logoComptaMatch from "../assets/logo-car-match.svg";

type HomepageSettings = {
  navbarLogoUrl?: string | null;
};

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors pb-1 border-b-2 border-transparent ${
      isActive ? "text-black border-black font-semibold" : "text-slate-700 hover:text-black"
    }`;

  const { user, isLoading, logout } = useAuth();
  const [branding, setBranding] = React.useState<HomepageSettings | null>(null);
  const [isNavOpen, setIsNavOpen] = React.useState(false);

  React.useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/homepage-settings`);
        const data = await response.json().catch(() => ({}));
        const settings = (data as { settings?: HomepageSettings }).settings;
        setBranding(settings || null);
      } catch (error) {
        console.warn("Logo navigation indisponible", error);
      }
    };

    loadBranding();
  }, []);

  const navbarLogo = branding?.navbarLogoUrl?.trim() || logoComptaMatch;

  const handleLogout = async () => {
    await logout("/");
    setIsNavOpen(false);
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={navbarLogo} alt="Logo COMPTAMATCH" className="h-8 w-auto flex-shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold tracking-wide text-black truncate">COMPTAMATCH</div>
              <div className="text-xs text-slate-500 truncate">
                L'aide à la comptabilité des TPE au meilleur prix.
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            {user && !isLoading && (
              <Link
                to="/mon-compte"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:border-black hover:text-black"
                aria-label="Espace client"
              >
                {user.email?.charAt(0).toUpperCase() || "A"}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsNavOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:border-black hover:text-black"
              aria-label="Ouvrir le menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`mt-4 flex-col gap-4 md:mt-3 md:flex md:flex-row md:items-center md:justify-between ${
            isNavOpen ? "flex" : "hidden md:flex"
          }`}
        >
          <nav
            className="flex flex-col gap-2 md:flex-row md:items-center md:justify-center md:gap-4"
            aria-label="Navigation principale"
          >
            <NavLink to="/" end className={navLinkClass}>
              Accueil
            </NavLink>
            <NavLink to="/offres" className={navLinkClass}>
              Comparer les offres
            </NavLink>
            <NavLink to="/tarifs" className={navLinkClass}>
              Tarifs
            </NavLink>
            <NavLink to="/telechargements" className={navLinkClass}>
              Nos logiciels
            </NavLink>
            <NavLink to="/panier" className={navLinkClass}>
              Panier
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
          </nav>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            {!user || isLoading ? (
              <>
                <Link
                  to="/auth/login"
                  className="flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-black hover:text-black"
                  aria-label="Se connecter"
                >
                  Se connecter
                </Link>
                <Link
                  to="/auth/register"
                  className="flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black"
                >
                  Créer un compte
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Link
                  to="/mon-compte"
                  className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
                  onClick={() => setIsNavOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[12px] font-semibold text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span>Mon compte</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:border-black hover:text-black"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
