import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { useWebApp } from "../../context/WebAppContext";

interface WebAppSidebarProps {
  onNavigate?: () => void;
  onQuit?: () => void;
}

const navItemClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
  }`;

const WebAppSidebar: React.FC<WebAppSidebarProps> = ({ onNavigate, onQuit }) => {
  const { ficheId: routeFicheId } = useParams<{ ficheId: string }>();
  const { context } = useWebApp();

  const ficheId = routeFicheId ?? context.fiche?.id ?? "";
  const typePath = context.type ?? "comptapro";
  const typeLabel = context.type === "comptasso" ? "ComptAsso" : "ComptaPro";
  const ficheName = context.fiche?.name || "Fiche sécurisée";
  const ficheLabel = ficheName.length > 26 ? `${ficheName.slice(0, 24)}…` : ficheName;

  const basePath = ficheId ? `/app/${typePath}/${ficheId}` : "#";

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const quitButton = (
    <button
      type="button"
      onClick={onQuit}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
    >
      <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-base">
        ⇠
      </span>
      Quitter
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{typeLabel}</p>
        <p className="text-base font-semibold text-slate-900" title={ficheName}>
          {ficheLabel}
        </p>
      </div>

      <nav className="flex-1 px-3 py-5">
        <div className="space-y-1">
          <NavLink to={`${basePath}/abonnements`} className={navItemClassName} onClick={handleNavigate}>
            <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
              A
            </span>
            Abonnements
          </NavLink>
          <NavLink to={`${basePath}/parametres`} className={navItemClassName} onClick={handleNavigate}>
            <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
              P
            </span>
            Paramètres
          </NavLink>
        </div>
      </nav>

      <div className="border-t border-slate-200 px-3 py-4">{quitButton}</div>
    </div>
  );
};

export default WebAppSidebar;
