import React from 'react';
import SectionTitle from '../components/SectionTitle';

const offers = [
  {
    name: 'Freemium',
    price: '0 € / mois',
    features: 'Saisie limitée, export CSV, support email standard',
    support: 'Email',
    limitations: '100 écritures / mois'
  },
  {
    name: 'Pro',
    price: '0 € / mois (démo)',
    features: 'Saisie illimitée, TVA, rapprochement bancaire, support prioritaire',
    support: 'Chat + email',
    limitations: 'Accès complet offert pendant la démo'
  },
  {
    name: 'Concurrent A',
    price: '39 € / mois',
    features: 'Fonctionnalités avancées mais interface complexe',
    support: 'Email',
    limitations: 'Formation payante'
  },
  {
    name: 'Concurrent B',
    price: '25 € / mois',
    features: 'Modèle basique sans automatisation',
    support: 'Email',
    limitations: 'Peu de mises à jour'
  }
];

const OffersPage = () => (
  <div className="max-w-6xl mx-auto px-4 py-12">
    <SectionTitle title="Offres & comparatif" subtitle="Choisissez l'offre la plus adaptée à votre TPE" />
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3">Nom de l'offre</th>
            <th className="px-4 py-3">Prix mensuel</th>
            <th className="px-4 py-3">Fonctionnalités clés</th>
            <th className="px-4 py-3">Support</th>
            <th className="px-4 py-3">Limitations</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.name} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{offer.name}</td>
              <td className="px-4 py-3 text-primary font-semibold">{offer.price}</td>
              <td className="px-4 py-3">{offer.features}</td>
              <td className="px-4 py-3">{offer.support}</td>
              <td className="px-4 py-3">{offer.limitations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default OffersPage;
