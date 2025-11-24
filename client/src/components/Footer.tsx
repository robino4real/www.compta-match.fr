import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-100 text-slate-700">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <p>© {currentYear} COMPTAMATCH. Tous droits réservés.</p>
        <div className="flex items-center gap-4">
          <Link to="/cgv" className="hover:text-black transition-colors">
            Conditions générales de vente
          </Link>
          <Link to="/mentions-legales" className="hover:text-black transition-colors">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="hover:text-black transition-colors">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
