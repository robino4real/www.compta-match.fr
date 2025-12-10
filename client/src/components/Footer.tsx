import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer: React.FC = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const isDarkFooter = React.useMemo(
    () => location.pathname.startsWith('/comptapro') || location.pathname.startsWith('/comptasso'),
    [location.pathname]
  );

  const containerClasses = isDarkFooter
    ? 'border-t border-white/10 bg-black mt-8 text-white'
    : 'border-t bg-slate-100 mt-8';

  const textMutedClasses = isDarkFooter ? 'text-xs text-white' : 'text-xs text-slate-500';
  const linkClasses = isDarkFooter
    ? 'hover:text-white text-white underline-offset-2 hover:underline'
    : 'hover:text-black text-slate-600 underline-offset-2 hover:underline';

  return (
    <footer className={containerClasses}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className={textMutedClasses}>
          © {currentYear} COMPTAMATCH. Tous droits réservés.
        </p>
        <div className={`flex flex-wrap items-center gap-4 text-xs ${isDarkFooter ? 'text-white' : 'text-slate-600'}`}>
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
