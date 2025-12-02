import React from "react";

const overviewCards = [
  {
    name: "ComptaPro",
    description: "Cabinet en ligne nouvelle génération, dédié aux TPE et indépendants.",
    strengths: [
      "Automatisation bancaire avec pré-catégorisation validée par nos équipes",
      "Collaboration directe avec un expert-comptable attitré",
      "Pilotage en temps réel : tableau de bord, alertes et relances clients",
    ],
    badge: "Notre solution",
  },
  {
    name: "Indy",
    description: "Solution déclarative pour indépendants et professions libérales.",
    strengths: [
      "Automatise les déclarations courantes",
      "Focus sur les statuts micro ou BNC",
      "Support principalement en ligne",
    ],
  },
  {
    name: "Axonaut",
    description: "ERP/CRM avec module comptable simplifié pour les petites structures.",
    strengths: [
      "Outils commerciaux et facturation intégrés",
      "Approche généraliste centrée sur la gestion",
      "Export comptable pour l'expert-comptable externe",
    ],
  },
  {
    name: "EBP Compta",
    description: "Logiciel historique à installer pour la comptabilité et la facturation.",
    strengths: [
      "Catalogue fonctionnel large",
      "Paramétrage avancé pour certains secteurs",
      "Installation locale et mises à jour manuelles",
    ],
  },
  {
    name: "MaCompta.fr",
    description: "Outil en ligne pour automatiser sa comptabilité avec accompagnement modulable.",
    strengths: [
      "Automatisation bancaire et saisies guidées",
      "Accompagnement comptable optionnel",
      "Formations et webinaires inclus",
    ],
  },
];

const comparisonOptions = [
  {
    id: "indy",
    title: "ComptaPro vs Indy",
    competitor: "Indy",
    summary: "Pour les indépendants et professions libérales qui veulent un pilotage complet avec un expert-comptable dédié.",
    rows: [
      {
        label: "Positionnement",
        comptapro: "Cabinet en ligne + automatisation, pensé pour sécuriser vos déclarations avec un accompagnement humain.",
        competitor: "Application déclarative orientée micro et BNC, moins de suivi personnalisé.",
      },
      {
        label: "Automatisation bancaire",
        comptapro: "Synchronisation multi-banques + pré-catégorisation validée et export comptable instantané.",
        competitor: "Synchronisation possible, catégorisation majoritairement à la charge de l'utilisateur.",
      },
      {
        label: "TVA et liasses",
        comptapro: "Déclarations et liasses pilotées par votre expert-comptable, avec rappels et contrôles.",
        competitor: "Automatise les déclarations courantes, mais accompagnement limité pour les cas complexes.",
      },
      {
        label: "Collaboration",
        comptapro: "Messagerie intégrée, tâches partagées et suivi des pièces pour échanger avec l'équipe comptable.",
        competitor: "Support chat standard, sans binôme dédié ni gestion de tâches collaborative.",
      },
      {
        label: "Facturation",
        comptapro: "Portail de facturation, relances automatiques et rapprochement des règlements.",
        competitor: "Facturation adaptée aux indépendants, moins de suivi automatisé des encaissements.",
      },
      {
        label: "Pilotage",
        comptapro: "Tableaux de bord temps réel, alertes TVA et trésorerie, rapports prêts pour la banque.",
        competitor: "Reporting plus standard, orienté obligations déclaratives.",
      },
    ],
  },
  {
    id: "axonaut",
    title: "ComptaPro vs Axonaut",
    competitor: "Axonaut",
    summary: "Pour les structures qui utilisent déjà des outils commerciaux et veulent un suivi comptable sans frictions.",
    rows: [
      {
        label: "Positionnement",
        comptapro: "Cabinet comptable + outil collaboratif tout-en-un, sans changer de CRM.",
        competitor: "ERP/CRM avec module compta simplifié, nécessitant souvent un expert-comptable externe.",
      },
      {
        label: "Onboarding",
        comptapro: "Migration guidée, récupération des historiques et paramétrage par nos équipes.",
        competitor: "Paramétrage à réaliser en interne, transfert de données vers l'expert-comptable à organiser.",
      },
      {
        label: "Automatisation",
        comptapro: "Rapprochement bancaire, OCR factures et pré-affectation des écritures.",
        competitor: "Exports comptables disponibles, mais catégorisation et contrôles à faire côté client ou cabinet externe.",
      },
      {
        label: "Collaboration cabinet",
        comptapro: "Équipe comptable dédiée directement dans l'outil, échanges contextualisés.",
        competitor: "Échanges avec l'expert-comptable en dehors d'Axonaut (export CSV ou FEC).",
      },
      {
        label: "Gestion commerciale",
        comptapro: "Connecteurs et imports pour vos devis/factures existants, sans imposer un CRM.",
        competitor: "CRM natif puissant, mais moins de profondeur sur les contrôles comptables.",
      },
      {
        label: "Suivi réglementaire",
        comptapro: "Veille fiscale et déclarations réalisées par le cabinet ComptaPro.",
        competitor: "Suivi réglementaire laissé à votre expert-comptable partenaire.",
      },
    ],
  },
  {
    id: "ebp",
    title: "ComptaPro vs EBP Compta",
    competitor: "EBP Compta",
    summary: "Pour moderniser une organisation habituée aux logiciels à installer et gagner en réactivité.",
    rows: [
      {
        label: "Installation",
        comptapro: "100% en ligne, pas de serveurs internes ni de mises à jour à gérer.",
        competitor: "Logiciel installé sur poste ou serveur, mises à jour manuelles récurrentes.",
      },
      {
        label: "Accessibilité",
        comptapro: "Accès web sécurisé pour les équipes financières et le cabinet, où que vous soyez.",
        competitor: "Accès local ou via VPN, moins fluide pour le travail hybride.",
      },
      {
        label: "Automatisation des flux",
        comptapro: "Synchronisation bancaire, OCR factures et contrôles par l'équipe comptable.",
        competitor: "Imports possibles mais paramétrage avancé requis, peu d'automatisation native.",
      },
      {
        label: "Collaboration",
        comptapro: "Commentaires sur pièces, tâches, partage en temps réel avec l'expert-comptable.",
        competitor: "Échanges par e-mail ou fichiers, sans espace collaboratif intégré.",
      },
      {
        label: "Maintenance",
        comptapro: "Support inclus, sauvegardes et sécurité gérés par ComptaPro.",
        competitor: "Maintenance et sauvegardes à la charge de l'entreprise ou de l'IT.",
      },
      {
        label: "Décisionnel",
        comptapro: "Tableaux de bord prêts à l'emploi et alertes personnalisées.",
        competitor: "Reporting paramétrable mais plus technique à configurer.",
      },
    ],
  },
  {
    id: "macompta",
    title: "ComptaPro vs MaCompta.fr",
    competitor: "MaCompta.fr",
    summary: "Pour ceux qui souhaitent conserver l'autonomie d'un outil en ligne tout en sécurisant chaque étape avec un cabinet.",
    rows: [
      {
        label: "Accompagnement",
        comptapro: "Expert-comptable dédié, échanges illimités et suivi proactif.",
        competitor: "Accompagnement modulable, prestations à la carte selon les besoins.",
      },
      {
        label: "Saisie et OCR",
        comptapro: "Reconnaissance automatique des factures + contrôle humain avant validation.",
        competitor: "Automatisation des pièces, validation majoritairement à la charge de l'utilisateur.",
      },
      {
        label: "Déclarations",
        comptapro: "TVA, liasse et paie gérées par le cabinet dans la même plateforme.",
        competitor: "TVA et déclarations disponibles, accompagnement expert limité aux options choisies.",
      },
      {
        label: "Facturation clients",
        comptapro: "Relances, suivi des encaissements et lettrage automatisé.",
        competitor: "Facturation intégrée, relances plus manuelles.",
      },
      {
        label: "Pilotage",
        comptapro: "Indicateurs trésorerie, marge et alertes personnalisées inclus.",
        competitor: "Tableaux de bord standards, peu de scénarios personnalisés.",
      },
      {
        label: "Temps gagné",
        comptapro: "Processus cadrés par le cabinet : moins d'aller-retours et clôtures plus rapides.",
        competitor: "Gain de temps sur la saisie, mais coordination avec le cabinet à organiser séparément.",
      },
    ],
  },
];

const CompareOffersPage: React.FC = () => {
  const [activeComparisonId, setActiveComparisonId] = React.useState(comparisonOptions[0].id);
  const activeComparison = comparisonOptions.find((item) => item.id === activeComparisonId)!;

  return (
    <main className="min-h-screen bg-white pb-16">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Comparatif</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Comparez ComptaPro avec les autres solutions du marché
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-600">
            Choisissez le comparatif qui vous correspond : la colonne de droite se met à jour instantanément
            pour mettre en avant les différences concrètes entre ComptaPro et chaque alternative.
          </p>
          <div className="mt-6 inline-flex gap-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <span className="inline-flex h-2 w-2 translate-y-[3px] rounded-full bg-emerald-500" aria-hidden />
            <span>Analyse indépendante de nos équipes produits</span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overviewCards.map((item) => (
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

      <section className="mx-auto mt-12 max-w-6xl px-4 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Choisissez votre comparatif</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">ComptaPro face à chaque solution</h3>
            <p className="mt-2 text-sm text-slate-600">
              Sélectionnez une alternative pour mettre à jour le tableau à droite.
            </p>
            <div className="mt-4 space-y-2">
              {comparisonOptions.map((option) => {
                const isActive = option.id === activeComparisonId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActiveComparisonId(option.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-800 hover:border-emerald-200"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{option.competitor}</p>
                    <p className="text-sm font-semibold text-slate-900">{option.title}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-200">
              Les tableaux évoluent instantanément pour montrer ce que change votre choix de logiciel ou de cabinet.
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Comparatif dynamique</p>
                <h3 className="text-xl font-semibold text-slate-900">{activeComparison.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{activeComparison.summary}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Tableau mis à jour automatiquement
              </span>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-600">
                      <th className="px-4 py-3 font-semibold text-slate-700">Critère</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">ComptaPro</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">{activeComparison.competitor}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeComparison.rows.map((row) => (
                      <tr key={row.label} className="align-top text-slate-800">
                        <th scope="row" className="bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-slate-900">
                          {row.label}
                        </th>
                        <td className="px-4 py-4 text-slate-700">{row.comptapro}</td>
                        <td className="px-4 py-4 text-slate-700">{row.competitor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
              <p className="font-semibold">À retenir</p>
              <p className="mt-1 text-slate-100">
                Vous pouvez changer de comparaison à gauche : ComptaPro reste la colonne de référence, le tableau s'adapte aux
                spécificités de {activeComparison.competitor} pour mieux guider votre choix.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-5xl px-4 lg:px-8">
        <div className="flex flex-col gap-6 rounded-3xl bg-slate-900 px-6 py-8 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-300">Prêt à comparer en détail ?</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Accédez à la démonstration ComptaPro</h3>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              Découvrez comment ComptaPro automatise vos flux comptables et simplifie la collaboration avec votre expert.
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
