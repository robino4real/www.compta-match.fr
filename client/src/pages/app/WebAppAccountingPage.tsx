import React from "react";
import { useWebApp, WebAppRouteType, WebAppType } from "../../context/WebAppContext";
import { useWebAppContextLoader } from "../../hooks/useWebAppContextLoader";

interface WebAppAccountingPageProps {
  expectedType: WebAppType;
  routeType: WebAppRouteType;
}

const WebAppAccountingPage: React.FC<WebAppAccountingPageProps> = ({ expectedType, routeType }) => {
  const { context } = useWebApp();
  const { isLoading, error, hasContext } = useWebAppContextLoader({ expectedType, routeType });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
        Chargement du module comptabilité...
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

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fiche {context.fiche.type}</p>
        <h1 className="text-2xl font-semibold text-slate-900">Ma comptabilité</h1>
        <p className="text-sm text-slate-600">Module comptabilité — à venir.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <p className="text-sm text-slate-700">Cette section accueillera vos fonctionnalités comptables.</p>
        <p className="mt-3 text-xs text-slate-500">Identifiant fiche : {context.fiche.id}</p>
      </div>
    </div>
  );
};

export default WebAppAccountingPage;
