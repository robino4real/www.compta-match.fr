import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoComptaMatch from './../assets/logo-car-match.svg';

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-black font-semibold' : 'text-slate-700 hover:text-black'}`;

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-[200px]">
          <img src={logoComptaMatch} alt="Logo COMPTAMATCH" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <div className="font-semibold tracking-wide text-black">COMPTAMATCH</div>
            <div className="text-sm text-slate-500">Votre comptabilité en toute simplicité et à petit prix</div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-6 flex-wrap">
          <nav className="flex items-center gap-4 flex-wrap">
            <NavLink to="/" className={navLinkClass} end>
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

          <div className="flex items-center gap-2">
            <Link
              to="/auth/login"
              className="rounded-full border border-black px-4 py-1 text-sm font-medium text-black transition hover:bg-black hover:text-white"
            >
              Se connecter
            </Link>
            <Link
              to="/auth/register"
              className="rounded-full bg-black px-4 py-1 text-sm font-medium text-white transition hover:bg-white hover:text-black hover:border hover:border-black"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
