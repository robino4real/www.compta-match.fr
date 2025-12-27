import React from "react";
import { API_BASE_URL } from "../config/api";
import { Link } from "react-router-dom";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  category?: string | null;
  readTimeMinutes?: number | null;
};

const FaqPage: React.FC = () => {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/articles`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((data as { message?: string }).message || "Impossible de charger les articles");
        }
        const list = Array.isArray((data as any)?.articles)
          ? ((data as any).articles as Article[])
          : [];
        setArticles(list);
      } catch (err: any) {
        setError(err?.message || "Impossible de charger la FAQ");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-2 pb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">FAQ & Guides</p>
          <h1 className="text-3xl font-semibold text-slate-900">Toutes les réponses et tutoriels</h1>
          <p className="text-sm text-slate-600">
            Retrouvez l'ensemble des articles publiés. Cliquez sur un bandeau pour ouvrir la page détaillée.
          </p>
        </div>

        {isLoading && <p className="text-center text-sm text-slate-500">Chargement…</p>}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {article.coverImageUrl && (
                    <img
                      src={article.coverImageUrl}
                      alt=""
                      className="h-14 w-20 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {article.category || "Article"}
                    </p>
                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700">
                      {article.title}
                    </h2>
                  </div>
                </div>
                {article.readTimeMinutes ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    {article.readTimeMinutes} min
                  </span>
                ) : null}
              </div>
              {article.excerpt && (
                <p className="text-sm text-slate-600 line-clamp-2">{article.excerpt}</p>
              )}
            </Link>
          ))}

          {!isLoading && articles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Aucun article publié pour le moment.
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default FaqPage;
