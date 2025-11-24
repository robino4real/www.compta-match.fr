import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-4xl font-semibold text-black">Page introuvable</h1>
      <p className="text-slate-700">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link
        to="/"
        className="inline-block rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFoundPage;
