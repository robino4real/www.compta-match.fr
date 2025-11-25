import React from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface ArticleDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  authorName?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  coverImageUrl?: string | null;
  readTimeMinutes?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
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

const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = React.useState<ArticleDetail | null>(null);
  const [recent, setRecent] = React.useState<ArticleDetail[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchArticle = React.useCallback(async () => {
    if (!slug) return;
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/articles/${slug}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de charger cet article."
        );
      }

      setArticle((data as { article: ArticleDetail }).article);
      setRecent(
        Array.isArray((data as { recent?: unknown }).recent)
          ? ((data as { recent: ArticleDetail[] }).recent as ArticleDetail[])
          : []
      );
    } catch (err: any) {
      console.error("Erreur lors du chargement de l'article", err);
      setError(
        err?.message || "Une erreur est survenue lors du chargement de l'article."
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  React.useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} | ComptaMatch`;
    }
  }, [article?.title]);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Chargement de l&apos;article...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!article) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-black">Article introuvable</h1>
        <p className="text-sm text-slate-600">
          L&apos;article que vous recherchez n&apos;est pas disponible ou a été retiré.
        </p>
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Retour aux articles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Ressources & blog
        </p>
        <h1 className="text-3xl font-semibold text-black">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          {article.category && (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800">
              {article.category}
            </span>
          )}
          {article.publishedAt && <span>Publié le {formatDate(article.publishedAt)}</span>}
          {article.authorName && <span>par {article.authorName}</span>}
          {article.readTimeMinutes && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              {article.readTimeMinutes} min de lecture
            </span>
          )}
        </div>
      </div>

      {article.coverImageUrl && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="prose max-w-none prose-h2:mt-8 prose-h2:text-xl prose-p:text-slate-700 prose-li:text-slate-700">
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 underline-offset-2 hover:text-black hover:underline"
        >
          ← Retour aux articles
        </Link>
        {article.publishedAt && (
          <span className="text-xs text-slate-500">
            Dernière publication : {formatDate(article.publishedAt)}
          </span>
        )}
      </div>

      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-black">Articles récents</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {recent.map((item) => (
              <Link
                key={item.id}
                to={`/articles/${item.slug}`}
                className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.category}</p>
                <h3 className="text-lg font-semibold text-black group-hover:text-emerald-700">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500">{formatDate(item.publishedAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ArticleDetailPage;
