import React from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface CustomPageSummary {
  id: string;
  key: string;
  route: string;
  name: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

type PageForm = {
  name: string;
  key: string;
  route: string;
  status: string;
};

const EMPTY_FORM: PageForm = {
  name: "",
  key: "",
  route: "",
  status: "ACTIVE",
};

const AdminPagesPage: React.FC = () => {
  const [pages, setPages] = React.useState<CustomPageSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<PageForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const loadPages = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/pages`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les pages.");
      }

      setPages(Array.isArray(data.pages) ? data.pages : []);
    } catch (err: any) {
      console.error("Erreur lors du chargement des pages", err);
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleFormChange = (field: keyof PageForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setActionMessage(null);

    try {
      const payload = {
        name: form.name.trim(),
        key: form.key.trim(),
        route: form.route.trim(),
        status: form.status,
      };

      const response = await fetch(`${API_BASE_URL}/admin/pages`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de créer la page.");
      }

      setActionMessage("Page créée avec succès.");
      setForm(EMPTY_FORM);
      setShowCreateModal(false);
      await loadPages();
    } catch (err: any) {
      console.error("Erreur lors de la création de la page", err);
      setError(err?.message || "Impossible de créer la page.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const statusBadge = (status: string) => {
    const classes =
      status === "ACTIVE"
        ? "bg-emerald-100 text-emerald-700"
        : status === "DRAFT"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-200 text-slate-700";

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${classes}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Page Builder</p>
          <h1 className="text-xl font-semibold text-black">Pages personnalisées</h1>
          <p className="text-xs text-slate-600">
            Gérez les pages administrables du site (home, tarifs, contact...) et accédez à leur builder.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadPages}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black"
          >
            Rafraîchir
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900"
          >
            Nouvelle page
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Pages</h2>
            <p className="text-xs text-slate-600">Liste complète des pages configurables.</p>
          </div>
          <button
            type="button"
            onClick={loadPages}
            className="text-xs font-semibold text-slate-700 hover:text-black"
          >
            Recharger
          </button>
        </div>

        {isLoading && <p className="text-xs text-slate-600">Chargement des pages...</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {actionMessage && <p className="text-xs text-emerald-600">{actionMessage}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Nom</th>
                  <th className="px-3 py-2">Route</th>
                  <th className="px-3 py-2">Clé</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Mise à jour</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-black">{page.name}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{page.route}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{page.key}</td>
                    <td className="px-3 py-2">{statusBadge(page.status)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{formatDate(page.updatedAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/admin/pages/${page.id}`}
                        className="text-xs font-semibold text-slate-700 hover:text-black"
                      >
                        Éditer la mise en page
                      </Link>
                    </td>
                  </tr>
                ))}
                {pages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-600">
                      Aucune page pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-black">Nouvelle page</h3>
                <p className="text-xs text-slate-600">Définissez les informations de base de la page.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs font-semibold text-slate-600 hover:text-black"
              >
                Fermer
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="modal-page-name">
                    Nom
                  </label>
                  <input
                    id="modal-page-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    placeholder="Ex: Page d'accueil"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="modal-page-status">
                    Statut
                  </label>
                  <select
                    id="modal-page-status"
                    value={form.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="modal-page-key">
                    Clé (unique)
                  </label>
                  <input
                    id="modal-page-key"
                    type="text"
                    value={form.key}
                    onChange={(e) => handleFormChange("key", e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    placeholder="Ex: HOME, LANDING_PROMO"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="modal-page-route">
                    Route (commence par /)
                  </label>
                  <input
                    id="modal-page-route"
                    type="text"
                    value={form.route}
                    onChange={(e) => handleFormChange("route", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    placeholder="/ma-page"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
                >
                  {isSaving ? "Création..." : "Créer la page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPagesPage;
