import React from "react";
import { Link } from "react-router-dom";
import { useWebApp, WebAppRouteType, WebAppType } from "../../context/WebAppContext";
import { useWebAppContextLoader } from "../../hooks/useWebAppContextLoader";

interface WebAppHomePageProps {
  expectedType: WebAppType;
  routeType: WebAppRouteType;
}

const IconCalculator: React.FC = () => (
  <svg
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5 text-indigo-600"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" className="fill-white" />
    <path d="M9 8h6m-3 9v-3m0 0v-3m0 3h3m-3 0H9" />
  </svg>
);

const IconDocuments: React.FC = () => (
  <svg
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5 text-sky-600"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path d="M6 4h7l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" className="fill-white" />
    <path d="M13 4v4a1 1 0 0 0 1 1h4" />
    <path d="M9 13h6M9 17h3" />
  </svg>
);

const WebAppHomePage: React.FC<WebAppHomePageProps> = ({ expectedType, routeType }) => {
  const { context } = useWebApp();
  const { isLoading, error, hasContext } = useWebAppContextLoader({ expectedType, routeType });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
        Chargement de votre espace...
      </div>
    );
  }

  if (error || !hasContext || !context.fiche) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
        {error || "Impossible de charger le contexte de la fiche."}
      </div>
    );
  }

  const fiche = context.fiche;
  const ficheId = fiche.id;
  const ficheTypeLabel = routeType === "comptasso" ? "ComptAsso" : "ComptaPro";
  const basePath = `/app/${routeType}/${ficheId}`;

  const tiles = [
    {
      title: "Ma comptabilité",
      description: "Accédez à vos modules comptables sécurisés.",
      icon: <IconCalculator />,
      to: `${basePath}/comptabilite`,
      accent: "border-indigo-200 bg-indigo-50/60 hover:border-indigo-300 hover:bg-indigo-50",
    },
    {
      title: "Mes documents comptables",
      description: "Importez et consultez vos documents essentiels.",
      icon: <IconDocuments />,
      to: `${basePath}/documents`,
      accent: "border-sky-200 bg-sky-50/60 hover:border-sky-300 hover:bg-sky-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Espace {ficheTypeLabel}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{fiche.name}</h1>
        <p className="text-sm text-slate-600">Choisissez un module pour poursuivre.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            to={tile.to}
            className={`group relative flex min-h-[160px] flex-col overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200 ${tile.accent}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
              {tile.icon}
            </div>
            <div className="mt-4 space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">{tile.title}</h2>
              <p className="text-sm text-slate-600">{tile.description}</p>
            </div>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-700 transition group-hover:translate-x-0.5">
              Ouvrir
              <span aria-hidden className="ml-2 inline-block">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WebAppHomePage;
