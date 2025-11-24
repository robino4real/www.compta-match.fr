import React from 'react';

const plans = [
  {
    name: 'Gratuit',
    price: '0 € / mois',
    description: 'Idéal pour démarrer et gérer les bases de votre comptabilité.',
    features: ['Facturation simple', 'Exports comptables', 'Accès 1 utilisateur']
  },
  {
    name: 'Pro',
    price: '29 € / mois',
    description: 'Automatisez vos flux financiers et gagnez du temps au quotidien.',
    features: ['Automatisations complètes', 'Support prioritaire', 'Portail client illimité']
  }
];

const PricingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-black">Tarifs</h1>
        <p className="text-slate-700">Choisissez l'offre qui correspond à votre activité.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-black">{plan.name}</h2>
              <p className="text-xl font-bold text-black">{plan.price}</p>
              <p className="text-sm text-slate-700">{plan.description}</p>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button className="mt-auto w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black">
              Souscrire
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
