import React from "react";
import { useNavigate } from "react-router-dom";
import { WebAppRouteType } from "../../context/WebAppContext";

interface WebAppErrorPageProps {
  status?: number;
  title?: string;
  message?: string;
  routeType?: WebAppRouteType;
}

const statusDefaults: Record<"401" | "403" | "404", { title: string; message: string }> = {
  "401": {
    title: "Authentification requise",
    message: "Votre session a expiré ou vous devez vous reconnecter pour accéder à cet espace sécurisé.",
  },
  "403": {
    title: "Accès interdit",
    message: "Vous n'êtes pas autorisé à consulter cette fiche ou cette ressource.",
  },
  "404": {
    title: "Ressource introuvable",
    message: "La fiche ou la ressource demandée est introuvable ou n'existe pas.",
  },
};

export const WebAppErrorPage: React.FC<WebAppErrorPageProps> = ({
  status = 404,
  title,
  message,
  routeType,
}) => {
  const navigate = useNavigate();
  const key = status.toString() as "401" | "403" | "404";
  const defaults = statusDefaults[key] ?? statusDefaults["404"];
  const resolvedTitle = title || defaults.title;
  const resolvedMessage = message || defaults.message;
  const fallbackPath = routeType === "comptasso" ? "/mon-espace-asso" : "/mon-espace-pro";

  const actionButtons = () => {
    if (status === 401) {
      return (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => navigate(fallbackPath)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Retour à l'espace client
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate(fallbackPath)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Retour à l'espace client
        </button>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <span className="text-lg font-semibold">{status}</span>
        </div>
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">WebApp sécurisée</p>
            <h1 className="text-xl font-semibold text-slate-900">{resolvedTitle}</h1>
          </div>
          <p className="text-sm text-slate-600">{resolvedMessage}</p>
          {actionButtons()}
        </div>
      </div>
    </div>
  );
};

export default WebAppErrorPage;
