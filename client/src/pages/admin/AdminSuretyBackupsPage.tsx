import React from "react";
import { API_BASE_URL } from "../../config/api";

interface SuretyBackupItem {
  id: string;
  ficheId: string;
  ficheName: string;
  ficheType: "COMPTAPRO" | "COMPTASSO";
  ownerId: string;
  ownerEmail: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  backupRelativePath: string;
  backupExists: boolean;
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
};

const ficheLabels: Record<SuretyBackupItem["ficheType"], string> = {
  COMPTAPRO: "ComptaPro",
  COMPTASSO: "ComptAsso",
};

const AdminSuretyBackupsPage: React.FC = () => {
  const [items, setItems] = React.useState<SuretyBackupItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const loadBackups = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/admin/backups/surete`, {
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de charger les sauvegardes de sûreté."
        );
      }

      const list = Array.isArray((data as { data?: { items?: unknown } }).data?.items)
        ? ((data as { data: { items: SuretyBackupItem[] } }).data.items as SuretyBackupItem[])
        : [];

      setItems(list);
    } catch (err: any) {
      console.error("Erreur lors du chargement des sauvegardes de sûreté", err);
      setError(err?.message || "Une erreur est survenue lors du chargement.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter(
      (item) =>
        item.ownerEmail.toLowerCase().includes(term) ||
        item.ficheName.toLowerCase().includes(term) ||
        item.originalName.toLowerCase().includes(term) ||
        item.backupRelativePath.toLowerCase().includes(term)
    );
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
              Sauvegardes critiques
            </p>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Sauvegardes de sûreté clients
            </h1>
            <p className="text-sm text-slate-600">
              Dossiers clients répliqués en temps réel. Téléchargez les archives sécurisées en cas de besoin.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadBackups()}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Rechercher par e-mail, fiche ou fichier"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:w-80"
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <span className="col-span-3">Client</span>
            <span className="col-span-3">Fiche</span>
            <span className="col-span-2">Fichier</span>
            <span className="col-span-2">Taille</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {isLoading ? (
            <div className="p-4 text-sm text-slate-600">Chargement des sauvegardes…</div>
          ) : !filteredItems.length ? (
            <div className="p-4 text-sm text-slate-600">Aucune sauvegarde trouvée.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <li key={item.id} className="grid grid-cols-12 items-center gap-2 px-3 py-3 text-sm text-slate-800">
                  <div className="col-span-3 space-y-1">
                    <p className="font-semibold text-slate-900">{item.ownerEmail}</p>
                    <p className="text-xs text-slate-600">{item.backupRelativePath}</p>
                  </div>
                  <div className="col-span-3 space-y-1">
                    <p className="font-semibold text-slate-900">{item.ficheName}</p>
                    <p className="text-xs text-slate-600">{ficheLabels[item.ficheType]}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="font-semibold text-slate-900">{item.originalName}</p>
                    <p className="text-xs text-slate-600">{item.mimeType}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-slate-900">{formatFileSize(item.sizeBytes)}</p>
                    <p className={`text-xs ${item.backupExists ? "text-emerald-700" : "text-amber-700"}`}>
                      {item.backupExists ? "Sauvegardé" : "Copie principale"}
                    </p>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <a
                      href={`${API_BASE_URL}/admin/backups/surete/${item.id}/download`}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-emerald-400 hover:text-emerald-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4m-9 8h10" />
                      </svg>
                      Télécharger
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSuretyBackupsPage;
