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

  const { user, isLoading } = useAuth();
  const [branding, setBranding] = React.useState<HomepageSettings | null>(null);

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

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-[220px]">
          <img src={navbarLogo} alt="Logo COMPTAMATCH" className="h-8 w-auto" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-black">COMPTAMATCH</div>
            <div className="text-xs text-slate-500">L'aide à la comptabilité des TPE au meilleur prix.</div>
          </div>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-4 flex-wrap" aria-label="Navigation principale">
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

        <div className="flex flex-col items-end gap-1 min-w-[150px]">
          {!user || isLoading ? (
            <Link
              to="/auth/login"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-300 bg-white text-slate-800 hover:border-black hover:text-black"
              aria-label="Se connecter"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-7 2-7 4.44A1.56 1.56 0 0 0 6.56 20h10.88A1.56 1.56 0 0 0 19 18.44C19 16 16 14 12 14Z"
                />
              </svg>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/mon-compte"
                className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-black hover:text-black transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">Mon compte</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
