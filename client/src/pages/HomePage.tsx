import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Automatisation comptable',
    description: 'Synchronisez vos écritures, factures et paiements pour rester conforme sans effort.'
  },
  {
    title: 'Tableaux de bord clairs',
    description: 'Visualisez vos indicateurs financiers clés et prenez des décisions sereinement.'
  },
  {
    title: 'Support dédié',
    description: 'Bénéficiez d\'une équipe disponible pour vous accompagner au quotidien.'
  }
];

const HomePage: React.FC = () => {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-xl bg-white p-8 shadow-sm md:grid-cols-2">
        <div className="space-y-5">
          <p className="inline-flex rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Logiciel comptable pour TPE
          </p>
          <h1 className="text-3xl font-bold text-black md:text-4xl">Logiciel de gestion comptable pour TPE</h1>
          <p className="text-lg text-slate-700">
            Centralisez votre facturation, vos abonnements et vos téléchargements dans une interface sobre et moderne.
            COMPTAMATCH vous aide à garder le contrôle sur votre comptabilité et vos produits numériques.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/auth/register"
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black"
            >
              Essayer gratuitement
            </Link>
            <Link
              to="/offres"
              className="rounded-full border border-black px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              Voir les offres
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Situation comptable</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">Mise à jour</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-black">+ 4 200 €</p>
            <p className="text-sm text-slate-600">Résultat net estimé ce mois-ci</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Factures réglées</p>
              <p className="text-2xl font-semibold text-black">92 %</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Téléchargements livrés</p>
              <p className="text-2xl font-semibold text-black">1 540</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Clients actifs</p>
            <p className="text-2xl font-semibold text-black">1 280</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-black">Fonctionnalités principales</h2>
          <p className="text-slate-700">Tout ce dont vous avez besoin pour une comptabilité simple et rigoureuse.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-black">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
