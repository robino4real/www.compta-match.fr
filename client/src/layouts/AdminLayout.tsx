import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ADMIN_NAV_SECTIONS } from "../config/adminNav";

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

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white px-4 py-6">
        <div className="px-3">
          <div className="text-lg font-semibold text-black">ComptaMatch Admin</div>
          <p className="text-xs text-slate-600">Gestion back-office</p>
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

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
