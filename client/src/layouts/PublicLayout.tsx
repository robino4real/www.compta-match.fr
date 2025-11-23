import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-primary font-semibold' : 'text-slate-600 hover:text-primary'}`;

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { items } = useCart();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary text-white flex items-center justify-center rounded-full font-bold">CM</div>
            <div>
              <p className="text-lg font-bold text-slate-900">ComptaMatch</p>
              <p className="text-sm text-slate-500">Logiciels de comptabilité pour TPE</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1">
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
              <NavLink to="/panier" className={navLinkClass}>
                Panier ({items.length})
              </NavLink>
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
              {user && (
                <NavLink to="/app" className={navLinkClass}>
                  Mon compte
                </NavLink>
              )}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/5"
              >
                Se connecter
              </Link>
              <Link
                to="/admin"
                className="px-4 py-2 border border-amber-500 text-amber-600 rounded-md text-sm font-medium hover:bg-amber-50"
              >
                Accès admin
              </Link>
              <Link to="/auth/register" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">{children}</main>

      <footer className="bg-slate-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2">ComptaMatch</h4>
            <p className="text-slate-300">Logiciels de comptabilité pour TPE et indépendants.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/offres" className="hover:text-accent">
                  Offres & comparatif
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="hover:text-accent">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/telechargements" className="hover:text-accent">
                  Logiciels téléchargeables
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Légal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/cgv" className="hover:text-accent">
                  Conditions générales de vente
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="hover:text-accent">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="hover:text-accent">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
