import React from "react";
import { useWebApp, WebAppRouteType, WebAppType } from "../../context/WebAppContext";
import { useWebAppContextLoader } from "../../hooks/useWebAppContextLoader";
import WebAppErrorPage from "../../components/app/WebAppErrorPage";

interface WebAppEntryPageProps {
  expectedType: WebAppType;
  routeType: WebAppRouteType;
}

const WebAppEntryPage: React.FC<WebAppEntryPageProps> = ({ expectedType, routeType }) => {
  const { context } = useWebApp();
  const { isLoading, error, hasContext } = useWebAppContextLoader({ expectedType, routeType });

  const ficheLabel =
    context.type === "comptapro"
      ? "ComptaPro"
      : context.type === "comptasso"
      ? "ComptAsso"
      : expectedType === "COMPTAPRO"
      ? "ComptaPro"
      : "ComptAsso";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Espace sécurisé {ficheLabel}</p>
        <h1 className="text-2xl font-semibold text-slate-900">Chargement de votre WebApp</h1>
        <p className="text-sm text-slate-600">
          Nous vérifions votre accès à la fiche et préparons l&apos;environnement dédié.
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Récupération du contexte de la fiche en cours...
        </div>
      )}

      {!isLoading && error && (
        <WebAppErrorPage status={error.status} message={error.message} routeType={routeType} />
      )}

      {!isLoading && !error && hasContext && context.fiche && context.user && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fiche sécurisée</p>
            <p className="text-lg font-semibold text-slate-900">
              {context.fiche.name} <span className="text-sm font-medium text-slate-500">({ficheLabel})</span>
            </p>
          </div>
          <p className="text-sm text-slate-600">
            L&apos;accès est validé. Vous pouvez poursuivre la navigation dans votre espace dédié.
          </p>
          <div className="text-xs text-slate-500">Utilisateur connecté : {context.user.email || context.user.id}</div>
        </div>
      )}
    </div>
  );
};

export default WebAppEntryPage;
