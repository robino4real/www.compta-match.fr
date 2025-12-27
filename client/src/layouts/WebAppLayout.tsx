import React from "react";
import { useNavigate } from "react-router-dom";
import WebAppSidebar from "../components/app/WebAppSidebar";
import { useWebApp } from "../context/WebAppContext";

interface WebAppLayoutProps {
  children: React.ReactNode;
}

const WebAppLayout: React.FC<WebAppLayoutProps> = ({ children }) => {
  const { context } = useWebApp();
  const navigate = useNavigate();
  const ficheName = context.fiche?.name || "Fiche sécurisée";
  const typeLabel = context.type === "comptapro" ? "ComptaPro" : context.type === "comptasso" ? "ComptAsso" : "WebApp";

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = React.useState(false);

  const fallbackPath = context.type === "comptapro" ? "/mon-espace-pro" : "/mon-espace-asso";

  const handleConfirmQuit = React.useCallback(() => {
    setShowQuitConfirm(false);
    const previousUrl = document.referrer;

    if (typeof window.close === "function") {
      window.close();
    }

    if (previousUrl && previousUrl.startsWith(window.location.origin) && !previousUrl.includes("/app/")) {
      window.location.href = previousUrl;
      return;
    }

    navigate(fallbackPath, { replace: true });
  }, [fallbackPath, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200 bg-white md:block">
          <WebAppSidebar onQuit={() => setShowQuitConfirm(true)} />
        </aside>

        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="h-full w-72 bg-white shadow-xl">
              <WebAppSidebar
                onNavigate={() => setIsMobileSidebarOpen(false)}
                onQuit={() => {
                  setShowQuitConfirm(true);
                  setIsMobileSidebarOpen(false);
                }}
              />
            </div>
            <div
              className="flex-1 bg-slate-900/20"
              role="presentation"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        )}

        <main className="flex min-h-screen flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
              aria-label="Ouvrir le menu"
            >
              <span className="block h-4 w-4 space-y-1">
                <span className="block h-0.5 w-full rounded-full bg-slate-700" />
                <span className="block h-0.5 w-full rounded-full bg-slate-700" />
                <span className="block h-0.5 w-full rounded-full bg-slate-700" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{typeLabel}</p>
              <p className="truncate text-base font-semibold text-slate-900" title={ficheName}>
                {ficheName}
              </p>
            </div>
          </div>

          <div className="flex-1 px-4 py-6 md:px-10 md:py-10">
            <div className="mx-auto max-w-5xl space-y-6">{children}</div>
          </div>
        </main>
      </div>

      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quitter la WebApp</p>
              <h2 className="text-xl font-semibold text-slate-900">Confirmer la fermeture</h2>
              <p className="text-sm text-slate-600">
                Voulez-vous quitter la WebApp ? Vous pourrez y revenir via votre espace client.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowQuitConfirm(false)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmQuit}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Quitter la WebApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebAppLayout;
