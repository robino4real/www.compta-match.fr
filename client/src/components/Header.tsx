import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-indigo-700 text-white py-4 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <div className="font-semibold text-lg">ComptaMatch</div>
        <nav className="flex gap-4 text-sm font-medium">
          <a href="#fonctions" className="hover:text-indigo-100">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="hover:text-indigo-100">
            Tarifs
          </a>
          <a href="#support" className="hover:text-indigo-100">
            Support
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
