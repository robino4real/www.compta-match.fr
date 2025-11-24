import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 py-6 text-gray-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">ComptaMatch • Solutions SaaS et produits numériques</p>
        <p className="text-gray-400">© {currentYear} ComptaMatch. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;
