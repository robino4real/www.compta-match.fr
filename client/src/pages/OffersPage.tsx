import React from 'react';

const offers = [
  {
    name: 'Freemium',
    price: '0 €',
    features: ['Facturation de base', 'Support par email', 'Exports comptables']
  },
  {
    name: 'Pro',
    price: '29 € / mois',
    features: ['Automatisations avancées', 'Support prioritaire', 'Portail client']
  },
  {
    name: 'Concurrent A',
    price: '39 € / mois',
    features: ['Fonctions standard', 'Support en semaine', 'Portail client']
  },
  {
    name: 'Concurrent B',
    price: '49 € / mois',
    features: ['Automatisation partielle', 'Support email', 'Exports']
  }
];

const OffersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-black">Offres & comparatif</h1>
        <p className="text-slate-700">Comparez COMPTAMATCH aux alternatives du marché.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-800">
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">Offre</th>
              <th className="px-4 py-3 font-semibold">Tarif</th>
              <th className="px-4 py-3 font-semibold">Fonctionnalités</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {offers.map((offer) => (
              <tr key={offer.name} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-black">{offer.name}</td>
                <td className="px-4 py-3 text-slate-800">{offer.price}</td>
                <td className="px-4 py-3 text-slate-700">
                  <ul className="list-disc space-y-1 pl-5">
                    {offer.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OffersPage;
