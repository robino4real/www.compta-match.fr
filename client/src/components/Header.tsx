import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoComptaMatch from "../assets/logo-car-match.svg";

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors pb-1 border-b-2 border-transparent ${
      isActive ? "text-black border-black font-semibold" : "text-slate-700 hover:text-black"
    }`;

  const { user, isLoading } = useAuth();

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-[220px]">
          <img src={logoComptaMatch} alt="Logo COMPTAMATCH" className="h-8 w-auto" />
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
            Offres & comparatif
          </NavLink>
          <NavLink to="/tarifs" className={navLinkClass}>
            Tarifs
          </NavLink>
          <NavLink to="/articles" className={navLinkClass}>
            Articles
          </NavLink>
          <NavLink to="/telechargements" className={navLinkClass}>
            Logiciels téléchargeables
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
            <>
              <NavLink to="/auth/login" className="text-sm font-semibold text-black hover:underline">
                Se connecter
              </NavLink>
              <NavLink to="/auth/register" className="text-xs text-slate-500 hover:text-black hover:underline">
                Créer un compte
              </NavLink>
            </>
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
