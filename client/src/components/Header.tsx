import React from 'react';
import { NavLink } from 'react-router-dom';
import logoComptaMatch from '../assets/logo-car-match.svg';

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors pb-1 border-b-2 border-transparent ${
      isActive ? 'text-black border-black font-semibold' : 'text-slate-700 hover:text-black'
    }`;

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

        <nav className="flex flex-1 items-center justify-center gap-4 flex-wrap">
          <NavLink to="/" end className={navLinkClass}>
            Accueil
          </NavLink>
          <NavLink to="/offres" className={navLinkClass}>
            Offres & comparatif
          </NavLink>
          <NavLink to="/tarifs" className={navLinkClass}>
            Tarifs
          </NavLink>
          <NavLink to="/telechargements" className={navLinkClass}>
            Logiciels téléchargeables
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        <div className="flex flex-col items-end gap-1 min-w-[150px]">
          <NavLink to="/auth/login" className="text-sm font-semibold text-black hover:underline">
            Se connecter
          </NavLink>
          <NavLink to="/auth/register" className="text-xs text-slate-500 hover:text-black hover:underline">
            Créer un compte
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Header;
