import React from "react";
import { Link } from "react-router-dom";

export function MainNavbar() {
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
          <Link className="text-slate-900" to="/" aria-label="Accueil">
            Accueil
          </Link>
          <Link className="hover:text-slate-900" to="/comptapro">
            Comparer les offres
          </Link>
          <Link className="hover:text-slate-900" to="/tarifs">
            Tarifs
          </Link>
          <Link className="hover:text-slate-900" to="/tarifs">
            Nos logiciels
          </Link>
          <Link className="hover:text-slate-900" to="/comptapro">
            ComptaPro
          </Link>
          <Link className="hover:text-slate-900" to="/contact">
            Contact
          </Link>
        </nav>

        {/* Bouton contact / compte (placeholder) */}
        <Link
          className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:flex"
          to="/contact"
        >
          <span>Contact</span>
        </Link>
      </div>
    </header>
  );
}

export default MainNavbar;
