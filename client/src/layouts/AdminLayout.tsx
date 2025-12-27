import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ADMIN_NAV_SECTIONS } from "../config/adminNav";
import { useAdminAuth } from "../context/AdminAuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const isActivePath = (pathname: string, href: string) => {
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { admin, logoutAdmin } = useAdminAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logoutAdmin("/admin");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 max-w-xs border-r border-slate-200 bg-white/90 px-4 py-6 shadow-sm backdrop-blur transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:block ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-3 lg:block">
          <div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-900 text-white px-3 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">
                CM
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-emerald-200">Console</p>
                <p className="text-sm font-semibold">ComptaMatch Admin</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-200">Navigation rapide et épurée par espaces métiers.</p>
          </div>
          <button
            type="button"
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:text-black"
            aria-label="Fermer le menu"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 space-y-4">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2 rounded-xl border border-slate-200 bg-white/70 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActivePath(location.pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/80"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                          active
                            ? "border-white/50 bg-white/10 text-white"
                            : "border-slate-200 bg-white text-slate-600 group-hover:border-slate-300"
                        }`}
                      >
                        •
                      </span>
                      <span className="flex-1 text-left leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-5 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-slate-800 shadow-[0_8px_18px_rgba(16,185,129,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Session</p>
          <p className="text-sm font-semibold">{admin?.email || "Administrateur"}</p>
          <p className="text-xs text-emerald-800/80">Profil connecté avec droits complets.</p>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
        />
      )}

      <main className="admin-shell flex-1 overflow-y-auto p-4 sm:p-6 lg:pl-0">
        <div className="admin-page-container mx-auto max-w-6xl space-y-5 sm:space-y-6">
          <header className="admin-hero-panel rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-start gap-3">
                <button
                  type="button"
                  className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-200 lg:hidden"
                  onClick={() => setIsMenuOpen(true)}
                  aria-label="Ouvrir le menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Console back-office</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Administration ComptaMatch</h1>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      Contenus, ventes et CRM
                    </span>
                  </div>
                  <p className="max-w-3xl text-sm text-slate-600">
                    Pages, offres, transactions et clients sont regroupés ici dans un environnement clair et organisé.
                    Naviguez par sections pour accéder rapidement à chaque sous-dossier métier.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="admin-hero-meta rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 ring-1 ring-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Session</p>
                  <p className="font-semibold text-slate-900">{admin?.email || "Administrateur"}</p>
                  <p className="text-xs text-slate-500">Connexion sécurisée et synchronisée Stripe</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-black"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </header>

          <div className="admin-page-body space-y-4 sm:space-y-5">
            <section className="admin-page-content">{children}</section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
