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
    <div className="min-h-screen flex bg-white">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:block ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-3 lg:block">
          <div>
            <div className="text-lg font-semibold text-black">ComptaMatch Admin</div>
            <p className="text-xs text-slate-600">Gestion back-office</p>
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

        <nav className="mt-6 space-y-6">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActivePath(location.pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {isMenuOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
        />
      )}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:pl-0">
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <div className="text-sm font-semibold text-black">Back-office</div>
                <p className="text-xs text-slate-600">Administration du site et des commandes</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden flex-col text-right leading-tight sm:flex">
                <span className="text-xs font-semibold text-black">{admin?.email || "Administrateur"}</span>
                <span className="text-[11px] text-slate-500">Session sécurisée</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
              >
                Se déconnecter
              </button>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
