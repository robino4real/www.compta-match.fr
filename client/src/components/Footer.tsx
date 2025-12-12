import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const containerClasses = 'bg-white text-slate-900';

  const textMutedClasses = 'text-xs text-slate-700';
  const linkClasses = 'hover:text-black text-slate-800 underline-offset-2 hover:underline';

  return (
    <footer className={containerClasses}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className={textMutedClasses}>
          © {currentYear} COMPTAMATCH. Tous droits réservés.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
          <Link to="/comparatif-des-offres" className={linkClasses}>
            Comparer les offres
          </Link>
          <Link to="/faq" className={linkClasses}>
            FAQ
          </Link>
          <Link to="/cgv" className={linkClasses}>
            Conditions générales de vente
          </Link>
          <Link to="/mentions-legales" className={linkClasses}>
            Mentions légales
          </Link>
          <Link to="/confidentialite" className={linkClasses}>
            Politique de confidentialité
          </Link>
          <Link to="/cookies" className={linkClasses}>
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
