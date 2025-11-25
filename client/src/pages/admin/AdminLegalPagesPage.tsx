import React from "react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface LegalPageSummary {
  id: string;
  key: string;
  title: string;
  slug: string;
  isPublished: boolean;
  updatedAt?: string;
}

const AdminLegalPagesPage: React.FC = () => {
  const [pages, setPages] = React.useState<LegalPageSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isSeeding, setIsSeeding] = React.useState(false);

  const loadPages = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/legal-pages`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de charger les pages légales."
        );
      }

      setPages(Array.isArray(data.pages) ? data.pages : []);
    } catch (err: any) {
      console.error("Erreur lors du chargement des pages légales", err);
      setError(
        err?.message || "Une erreur est survenue lors du chargement des pages."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleSeedDefaults = async () => {
    try {
      setIsSeeding(true);
      setActionMessage(null);
      setActionError(null);
      const response = await fetch(
        `${API_BASE_URL}/admin/legal-pages/seed-defaults`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de créer les pages par défaut."
        );
      }

      setActionMessage(
        data.message || "Pages légales créées ou déjà existantes."
      );
      setPages(Array.isArray(data.pages) ? data.pages : pages);
    } catch (err: any) {
      console.error("Erreur lors de la création des pages légales", err);
      setActionError(
        err?.message || "Impossible d'initialiser les pages légales."
      );
    } finally {
      setIsSeeding(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Pages légales</h1>
          <p className="text-xs text-slate-600">
            Gérez le contenu des mentions légales, CGV, politique de confidentialité et cookies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black disabled:opacity-50"
          >
            {isSeeding ? "Création..." : "Créer les pages par défaut"}
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {isLoading && (
          <p className="text-xs text-slate-600">Chargement des pages légales...</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {actionMessage && (
          <p className="text-xs text-emerald-600">{actionMessage}</p>
        )}
        {actionError && (
          <p className="text-xs text-red-600">{actionError}</p>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Titre</th>
                  <th className="px-3 py-2">Clé</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Publiée ?</th>
                  <th className="px-3 py-2">Mise à jour</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 font-semibold text-black">{page.title}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{page.key}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">/{page.slug}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                          page.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {page.isPublished ? "Publiée" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatDate(page.updatedAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/admin/legal-pages/${page.id}`}
                        className="text-xs font-semibold text-slate-700 underline-offset-2 hover:text-black hover:underline"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminLegalPagesPage;
