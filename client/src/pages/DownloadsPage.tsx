import React from 'react';

const products = [
  {
    name: 'ComptaMini',
    description: 'Edition comptabilité générale pour micro-entreprises.',
    price: '79 €'
  },
  {
    name: 'ComptaFacto',
    description: 'Gestion des factures récurrentes et suivi des règlements.',
    price: '129 €'
  },
  {
    name: 'ComptaDocs',
    description: 'Bibliothèque de modèles comptables prêts à l\'emploi.',
    price: '49 €'
  }
];

const DownloadsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-black">Logiciels téléchargeables</h1>
        <p className="text-slate-700">Accédez à nos outils prêts à l'emploi pour compléter votre gestion.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {products.map((product) => (
          <div key={product.name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-black">{product.name}</h2>
              <p className="text-sm text-slate-700">{product.description}</p>
            </div>
            <p className="text-lg font-semibold text-black">{product.price}</p>
            <button className="rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white">
              Voir le produit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadsPage;
