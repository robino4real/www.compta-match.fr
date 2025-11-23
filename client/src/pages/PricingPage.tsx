import React from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';

const plans = [
  {
    name: 'Freemium',
    price: '0 € / mois',
    features: ['100 écritures / mois', 'Exports CSV', 'Support email standard'],
    cta: 'Démarrer gratuitement'
  },
  {
    name: 'Pro (offre test 0 €)',
    price: '0 € / mois pendant la démo',
    features: ['Écritures illimitées', 'TVA & rapprochement', 'Support prioritaire', 'Accès API'],
    cta: 'Activer mon essai gratuit'
  }
];

const PricingPage = () => (
  <div className="max-w-6xl mx-auto px-4 py-12">
    <SectionTitle title="Tarifs" subtitle="Des plans clairs et sans surprise" />
    <div className="grid md:grid-cols-2 gap-6">
      {plans.map((plan) => (
        <div key={plan.name} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            <p className="text-primary text-lg font-semibold">{plan.price}</p>
          </div>
          <ul className="mt-4 space-y-2 text-slate-700">
            {plan.features.map((feat) => (
              <li key={feat} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/auth/register"
            className="mt-6 inline-flex justify-center px-5 py-3 bg-primary text-white rounded-md font-semibold"
          >
            {plan.cta}
          </Link>
          {plan.name === 'Pro' && (
            <p className="text-xs text-slate-500 mt-2">Paiement sécurisé via Stripe en mode test. Webhook simulé côté back.</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default PricingPage;
