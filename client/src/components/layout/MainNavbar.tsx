import React from "react";

export function MainNavbar() {
  return (
    <header className="w-full border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-0">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-xs font-semibold text-white">
            CM
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            COMPTAMATCH
          </span>
        </a>

        {/* Menu principal */}
        {/* TODO: activer la navigation plus tard */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <button className="text-slate-900" type="button" aria-label="Accueil">
            Accueil
          </button>
          <button className="hover:text-slate-900" type="button">
            Comparer les offres
          </button>
          <button className="hover:text-slate-900" type="button">
            Nos tarifs
          </button>
          <button className="hover:text-slate-900" type="button">
            Contact
          </button>
        </nav>

        {/* Bouton contact / compte (placeholder) */}
        <button
          className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:flex"
          type="button"
        >
          <span>Contact</span>
        </button>
      </div>
    </header>
  );
}

export default MainNavbar;
