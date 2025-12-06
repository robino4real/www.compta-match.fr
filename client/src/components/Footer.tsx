import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-slate-100 mt-8">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          © {currentYear} COMPTAMATCH. Tous droits réservés.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <Link to="/comparatif-des-offres" className="hover:text-black underline-offset-2 hover:underline">
            Comparer les offres
          </Link>
          <Link to="/faq" className="hover:text-black underline-offset-2 hover:underline">
            FAQ
          </Link>
          <Link to="/cgv" className="hover:text-black underline-offset-2 hover:underline">
            Conditions générales de vente
          </Link>
          <Link to="/mentions-legales" className="hover:text-black underline-offset-2 hover:underline">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="hover:text-black underline-offset-2 hover:underline">
            Politique de confidentialité
          </Link>
          <Link to="/cookies" className="hover:text-black underline-offset-2 hover:underline">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
