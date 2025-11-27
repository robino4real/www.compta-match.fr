import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import StructuredDataScript from "../components/StructuredDataScript";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  authorName?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  coverImageUrl?: string | null;
  readTimeMinutes?: number | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getExcerpt = (article: ArticleItem) => {
  if (article.excerpt) return article.excerpt;
  const stripped = article.content.replace(/<[^>]+>/g, " ");
  return stripped.slice(0, 180) + (stripped.length > 180 ? "..." : "");
};

const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = React.useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [structuredData, setStructuredData] = React.useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = React.useState(
    searchParams.get("search") ?? ""
  );
  const [categoryFilter, setCategoryFilter] = React.useState(
    searchParams.get("category") ?? ""
  );

  const categories = React.useMemo(
    () =>
      Array.from(
        new Set(
          articles
            .map((article) => article.category)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [articles]
  );

  const fetchArticles = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (categoryFilter.trim()) params.set("category", categoryFilter.trim());

      const response = await fetch(
        `${API_BASE_URL}/articles${params.toString() ? `?${params.toString()}` : ""}`
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de charger les articles pour le moment."
        );
      }

      const list = Array.isArray((data as { articles?: unknown }).articles)
        ? ((data as { articles: ArticleItem[] }).articles as ArticleItem[])
        : [];

      setArticles(list);
      setStructuredData(
        Array.isArray((data as any)?.structuredData) ? (data as any).structuredData : null
      );
    } catch (err: any) {
      console.error("Erreur lors du chargement des articles", err);
      setError(
        err?.message || "Une erreur est survenue lors du chargement des articles."
      );
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, searchTerm]);

  React.useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const applyFilters = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const next = new URLSearchParams();
    if (searchTerm.trim()) next.set("search", searchTerm.trim());
    if (categoryFilter.trim()) next.set("category", categoryFilter.trim());
    setSearchParams(next);
    navigate({ pathname: "/articles", search: next.toString() });
    fetchArticles();
  };

  return (
    <div className="space-y-8">
      <StructuredDataScript data={structuredData} />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Ressources & blog
        </p>
        <h1 className="text-3xl font-semibold text-black">Articles ComptaMatch</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Retrouvez nos guides pratiques, mises à jour réglementaires et conseils pour
          gérer votre comptabilité sereinement.
        </p>
      </div>

      <form
        onSubmit={applyFilters}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center"
      >
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-700">Rechercher</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Titre ou mots-clés"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="space-y-1 md:w-64">
          <label className="text-xs font-semibold text-slate-700">Catégorie</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end md:h-full">
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Filtrer
          </button>
        </div>
      </form>

      {isLoading && (
        <p className="text-sm text-slate-600">Chargement des articles...</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <article
              key={article.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {article.coverImageUrl && (
                <div className="h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {article.category && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      {article.category}
                    </span>
                  )}
                  {article.readTimeMinutes && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      {article.readTimeMinutes} min de lecture
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-black">{article.title}</h2>
                  <p className="text-sm text-slate-600">{getExcerpt(article)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                  <div className="flex flex-col text-left">
                    <span>{formatDate(article.publishedAt)}</span>
                    {article.authorName && (
                      <span className="text-[11px] text-slate-500">par {article.authorName}</span>
                    )}
                  </div>
                  <Link
                    to={`/articles/${article.slug}`}
                    className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-900 hover:underline"
                  >
                    Lire l&apos;article
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {articles.length === 0 && (
            <div className="md:col-span-2">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                Aucun article publié pour le moment. Revenez bientôt !
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticlesPage;
