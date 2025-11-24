import React from "react";
import { useNavigate } from "react-router-dom";

type CompetitorId = "axonaut" | "indy" | "exacompta";

interface Competitor {
  id: CompetitorId;
  name: string;
  description: string;
}

const competitors: Competitor[] = [
  { id: "axonaut", name: "Axonaut", description: "Logiciel de gestion pour TPE/PME." },
  { id: "indy", name: "Indy", description: "Solution de comptabilité pour indépendants." },
  { id: "exacompta", name: "Exacompta", description: "Solution de gestion comptable plus traditionnelle." },
];

interface ComparisonRow {
  label: string;
  comptamatch: string;
  axonaut: string;
  indy: string;
  exacompta: string;
}

const rows: ComparisonRow[] = [
  {
    label: "Tarif de départ (HT)",
    comptamatch: "À partir de 19 € / mois",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
  {
    label: "Engagement",
    comptamatch: "Sans engagement, abonnement mensuel",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
  {
    label: "Cible principale",
    comptamatch: "TPE et indépendants digitaux",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
  {
    label: "Simplicité d'utilisation",
    comptamatch: "Interface épurée, parcours guidés",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
  {
    label: "Paramétrage pour TPE",
    comptamatch: "Modèles prêts à l'emploi pour TPE",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
  {
    label: "Accès web / mobile",
    comptamatch: "Web responsive, appli web mobile-first",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
  {
    label: "Support",
    comptamatch: "Support humain par chat et email",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
  {
    label: "Automatisations",
    comptamatch: "Rappels intelligents et rapprochement automatique",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
  {
    label: "Exports comptables",
    comptamatch: "Exports FEC, PDF et API partenaires",
    axonaut: "Texte par défaut",
    indy: "Texte par défaut",
    exacompta: "Texte par défaut",
  },
];

const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCompetitor, setSelectedCompetitor] = React.useState<CompetitorId>("axonaut");

  const activeCompetitor = competitors.find((comp) => comp.id === selectedCompetitor);
  const competitorName = activeCompetitor?.name ?? "";

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-black">Comparatif COMPTAMATCH vs concurrents</h1>
        <p className="text-sm text-slate-600">
          Comparez l&apos;offre COMPTAMATCH avec d&apos;autres solutions de gestion et de comptabilité pour
          TPE. Ce comparatif concerne uniquement l&apos;application web par abonnement.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-[220px,1fr]">
        <aside className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-black mb-3">Comparatifs disponibles</h2>
          <ul className="space-y-2">
            {competitors.map((comp) => {
              const isActive = comp.id === selectedCompetitor;
              return (
                <li key={comp.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCompetitor(comp.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                      isActive
                        ? "border-black bg-slate-100 text-black"
                        : "border-slate-200 bg-white text-slate-700 hover:border-black"
                    }`}
                  >
                    <div className="font-medium">{comp.name}</div>
                    <div className="text-xs text-slate-500">{comp.description}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-black">COMPTAMATCH vs {competitorName}</h2>
            <p className="text-xs text-slate-500">
              Comparatif indicatif basé sur des informations publiques et des hypothèses par défaut.
            </p>
          </header>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Critère</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">COMPTAMATCH</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{competitorName}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const competitorValue = row[selectedCompetitor];
                  return (
                    <tr key={row.label} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 align-top text-xs text-slate-600">{row.label}</td>
                      <td className="px-4 py-3 align-top text-xs text-black">{row.comptamatch}</td>
                      <td className="px-4 py-3 align-top text-xs text-slate-700">{competitorValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                // TODO: plus tard, si l'utilisateur est connecté, lancer un vrai processus de paiement.
                // Pour l'instant, on renvoie vers la page de connexion / création de compte.
                navigate("/auth/login");
              }}
              className="rounded-full bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
            >
              Essayer COMPTAMATCH
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OffersPage;
