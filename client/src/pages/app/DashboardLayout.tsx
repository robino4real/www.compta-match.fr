import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100'}`;

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 grid md:grid-cols-[260px_1fr]">
      <aside className="bg-white border-r border-slate-200 p-4 space-y-4">
        <div>
          <p className="text-sm text-slate-500">Connecté en tant que</p>
          <p className="font-semibold text-slate-900">{user?.firstName}</p>
        </div>
        <nav className="space-y-1">
          <NavLink to="/app" end className={linkClass}>
            Tableau de bord
          </NavLink>
          <NavLink to="/app/freemium" className={linkClass}>
            App compta - Freemium
          </NavLink>
          <NavLink to="/app/pro" className={linkClass}>
            App compta - Version Pro
          </NavLink>
          <NavLink to="/app/telechargements" className={linkClass}>
            Mes téléchargements
          </NavLink>
          <NavLink to="/app/abonnement" className={linkClass}>
            Mon abonnement
          </NavLink>
          <NavLink to="/app/paiements" className={linkClass}>
            Mes factures / paiements
          </NavLink>
          <NavLink to="/app/parametres" className={linkClass}>
            Paramètres du compte
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>
        <button onClick={logout} className="text-sm text-red-600">
          Se déconnecter
        </button>
        <Link to="/" className="text-sm text-primary block">
          Retour au site
        </Link>
      </aside>
      <section className="p-6">
        <Outlet />
      </section>
    </div>
  );
};

export default DashboardLayout;
