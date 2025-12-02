import React from "react";

const competitors = [
  {
    name: "ComptaMatch",
    description: "Une plateforme moderne pensée pour les TPE et indépendants.",
    strengths: [
      "Automatisations bancaires et pré-catégorisation des écritures",
      "Collaboration simplifiée avec votre expert-comptable",
      "Support réactif et tarifs transparents",
    ],
    badge: "Notre solution",
  },
  {
    name: "Logiciels traditionnels",
    description: "Solutions historiques à installer, moins flexibles pour le travail à distance.",
    strengths: [
      "Interface vieillissante et mises à jour manuelles",
      "Frais additionnels pour les modules avancés",
      "Peu d'outils collaboratifs pour partager les dossiers",
    ],
  },
  {
    name: "Cabinets concurrents",
    description: "Offres complètes mais souvent plus chères et moins spécialisées TPE.",
    strengths: [
      "Honoraires variables selon la taille du dossier",
      "Temps de traitement plus long pour les pièces",
      "Échanges principalement par e-mail, sans suivi centralisé",
    ],
  },
];

const comparisonPoints = [
  {
    label: "Tarification",
    comptamatch: "Abonnement clair, sans frais cachés",
    others: "Coûts additionnels et options payantes",
  },
  {
    label: "Mise en route",
    comptamatch: "Onboarding assisté et synchronisation bancaire rapide",
    others: "Paramétrage manuel et formation payante",
  },
  {
    label: "Collaboration",
    comptamatch: "Espace partagé, suivi des tâches et commentaires en contexte",
    others: "Échanges par e-mail ou fichiers partagés",
  },
  {
    label: "Suivi temps réel",
    comptamatch: "Tableau de bord et alertes personnalisées",
    others: "Reporting périodique, peu d'alertes automatiques",
  },
];

const CompareOffersPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-white pb-16">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Comparatif
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Comparez ComptaMatch avec les autres solutions du marché
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-600">
            Identifiez rapidement la solution la plus adaptée à votre organisation. Nous avons
            résumé les avantages de ComptaMatch face aux logiciels traditionnels et aux cabinets
            concurrents afin de faciliter votre choix.
          </p>
          <div className="mt-6 inline-flex gap-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <span className="inline-flex h-2 w-2 translate-y-[3px] rounded-full bg-emerald-500" aria-hidden />
            <span>Analyse indépendante de nos équipes produits</span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-5xl px-4 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {competitors.map((item) => (
            <article
              key={item.name}
              className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
            >
              <header className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{item.badge || "Alternative"}</p>
                  <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
                </div>
              </header>
              <p className="text-sm text-slate-600">{item.description}</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {item.strengths.map((strength) => (
                  <li key={strength} className="flex gap-2">
                    <span className="mt-[6px] inline-block h-2 w-2 rounded-full bg-slate-300" aria-hidden />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-5xl px-4 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-xl font-semibold text-slate-900">Points clés du comparatif</h3>
          <p className="mt-2 text-sm text-slate-600">
            Une lecture rapide des différences majeures pour choisir l'offre qui vous convient.
          </p>
          <div className="mt-6 space-y-4">
            {comparisonPoints.map((point) => (
              <div
                key={point.label}
                className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700 md:grid-cols-[1.2fr,1fr,1fr]"
              >
                <div className="font-semibold text-slate-900">{point.label}</div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.08em]">ComptaMatch</p>
                  <p className="mt-1 text-slate-800">{point.comptamatch}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.08em]">Autres solutions</p>
                  <p className="mt-1 text-slate-800">{point.others}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-5xl px-4 lg:px-8">
        <div className="flex flex-col gap-6 rounded-3xl bg-slate-900 px-6 py-8 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-300">Prêt à comparer en détail ?</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Accédez à la démonstration ComptaMatch</h3>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              Découvrez comment ComptaMatch automatise vos flux comptables et simplifie la collaboration avec votre expert.
            </p>
          </div>
          <a
            href="/comptapro"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            Voir ComptaPro en détail
          </a>
        </div>
      </section>
    </main>
  );
};

export default CompareOffersPage;
