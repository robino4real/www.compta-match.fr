import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  authorName?: string | null;
  category?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  createdAt?: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const statusBadgeClass = (status: ArticleRow["status"]) => {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-100 text-emerald-700";
    case "ARCHIVED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
};

const statusLabel = (status: ArticleRow["status"]) => {
  if (status === "PUBLISHED") return "Publié";
  if (status === "ARCHIVED") return "Archivé";
  return "Brouillon";
};

const AdminArticlesPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = React.useState<ArticleRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("");
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const loadArticles = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(
        `${API_BASE_URL}/admin/articles${params.toString() ? `?${params.toString()}` : ""}`,
        { credentials: "include" }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de charger les articles."
        );
      }

      setArticles(
        Array.isArray((data as { articles?: unknown }).articles)
          ? ((data as { articles: ArticleRow[] }).articles as ArticleRow[])
          : []
      );
    } catch (err: any) {
      console.error("Erreur lors du chargement des articles", err);
      setError(
        err?.message || "Une erreur est survenue lors du chargement des articles."
      );
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, searchTerm, statusFilter]);

  React.useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Administration
          </p>
          <h1 className="text-xl font-semibold text-black">Articles</h1>
          <p className="text-xs text-slate-600">
            Gérez les contenus publiés sur le blog / centre de ressources.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/articles/new")}
          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Ajouter un article
        </button>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Tous</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Catégorie</label>
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Ex : Comptabilité"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Recherche</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Titre, slug, auteur..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadArticles}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
          >
            Appliquer les filtres
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setCategoryFilter("");
              setSearchTerm("");
              loadArticles();
            }}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
          >
            Réinitialiser
          </button>
        </div>

        {isLoading && (
          <p className="text-xs text-slate-600">Chargement des articles...</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Titre</th>
                  <th className="px-3 py-2">Auteur</th>
                  <th className="px-3 py-2">Catégorie</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Publié le</th>
                  <th className="px-3 py-2">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 font-semibold text-black">
                      <div className="flex flex-col">
                        <Link
                          to={`/admin/articles/${article.id}`}
                          className="text-sm font-semibold text-black underline-offset-2 hover:text-emerald-700 hover:underline"
                        >
                          {article.title}
                        </Link>
                        <span className="text-[11px] text-slate-500">/{article.slug}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {article.authorName || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {article.category || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadgeClass(
                          article.status
                        )}`}
                      >
                        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current opacity-70" />
                        {statusLabel(article.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatDate(article.publishedAt)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatDate(article.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {articles.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-600">
                Aucun article trouvé avec ces filtres.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminArticlesPage;
