import React from "react";

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
        <div className="px-4 py-12 lg:px-12 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Comparatif</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Comparatif des offres comptables en ligne
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-600">
            Sélectionnez une solution concurrente dans le menu latéral : le tableau se met à jour automatiquement
            pour afficher les différences concrètes avec ComptaPro.
          </p>
          <div className="mt-6 inline-flex gap-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <span className="inline-flex h-2 w-2 translate-y-[3px] rounded-full bg-emerald-500" aria-hidden />
            <span>Tableau de comparaison mis à jour en temps réel</span>
          </div>
        </div>
      </section>

      <section className="mt-6 lg:mt-10">
        <div className="grid lg:grid-cols-[300px,1fr] lg:gap-0">
          <aside className="border-y border-r border-slate-200 bg-slate-50/70 px-4 py-6 shadow-sm lg:sticky lg:top-20 lg:min-h-[70vh] lg:px-6 lg:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Menu comparatif</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Choisissez une alternative</h3>
            <p className="mt-2 text-sm text-slate-600">Chaque clic met à jour instantanément le tableau principal.</p>
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
              Le tableau reste centré sur ComptaPro et s'adapte à chaque concurrent sélectionné.
            </div>
          </aside>

          <div className="px-4 py-6 lg:border-y lg:border-slate-200 lg:px-12 lg:py-10">
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
                  Choisissez un concurrent dans le menu à gauche : le tableau reste focalisé sur ComptaPro et affiche
                  instantanément les différences clés.
                </p>
              </div>
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
