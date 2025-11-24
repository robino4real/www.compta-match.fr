import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12">
        <section className="grid gap-8 rounded-2xl bg-white p-8 shadow-md lg:grid-cols-2">
          <div className="space-y-4">
            <p className="inline-flex rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-800">
              SaaS comptable & produits numériques
            </p>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
              Simplifiez votre comptabilité et proposez vos produits numériques en quelques clics.
            </h1>
            <p className="text-lg text-slate-600">
              ComptaMatch vous aide à gérer vos abonnements SaaS et à vendre vos ressources téléchargeables
              grâce à une interface moderne et sécurisée.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-lg bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-800">
                Démarrer la démo
              </button>
              <button className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50">
                Découvrir les fonctionnalités
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-indigo-100 via-white to-indigo-50 p-6 shadow-inner">
            <div className="space-y-3 text-slate-800">
              <p className="text-sm font-semibold text-indigo-700">Tableau de bord aperçu</p>
              <div className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Revenus récurrents</span>
                  <span className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    +12% ce mois
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">4 250 €</p>
                <p className="text-sm text-slate-500">Abonnements actifs et ventes numériques</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-slate-600">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold text-slate-900">1 280</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-slate-600">Produits livrés</p>
                  <p className="text-2xl font-bold text-slate-900">342</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fonctions" className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Automatisation comptable',
              description: 'Synchronisez vos écritures, factures et règlements pour rester conforme en toute simplicité.'
            },
            {
              title: 'Paiements sécurisés',
              description: 'Acceptez les cartes bancaires et délivrez immédiatement vos produits numériques.'
            },
            {
              title: 'Portail client',
              description: 'Offrez à vos clients un espace dédié pour suivre leurs abonnements et téléchargements.'
            }
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl bg-white p-6 shadow-md">
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default App;
