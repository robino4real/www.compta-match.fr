import React from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

type Article = {
  id: string;
  title: string;
  slug: string;
  content?: string | null;
  coverImageUrl?: string | null;
  category?: "ARTICLE" | "TUTORIAL" | null;
  authorName?: string | null;
  readTimeMinutes?: number | null;
  publishedAt?: string | null;
  youtubeUrl?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const extractYouTubeId = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const watchMatch = trimmed.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return watchMatch[1];

  const shortMatch = trimmed.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch?.[1]) return shortMatch[1];

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  return null;
};

const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = React.useState<Article | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      if (!slug) {
        setError("Article introuvable");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/articles/${slug}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error((data as { message?: string }).message || "Article introuvable");
        }

        const fetched = (data as { article?: Article }).article;
        setArticle(fetched ?? null);
      } catch (err: any) {
        setError(err?.message || "Impossible de charger cet article");
        setArticle(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [slug]);

  const publishedDate = formatDate(article?.publishedAt);
  const youtubeId = article?.category === "TUTORIAL" ? extractYouTubeId(article?.youtubeUrl) : null;
  const categoryLabel = article?.category === "TUTORIAL" ? "Tutoriel" : "Article";

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="pb-6 text-sm">
          <Link to="/faq" className="text-emerald-700 hover:text-emerald-900">
            ← Articles et FAQ
          </Link>
        </div>

        {isLoading && <p className="text-center text-sm text-slate-500">Chargement…</p>}
        {error && !isLoading && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <p className="mt-2 text-sm text-slate-600">L'article demandé est introuvable ou indisponible.</p>
          </div>
        )}

        {!isLoading && article && (
          <article className="space-y-6">
            <div className="space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {categoryLabel}
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">{article.title}</h1>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
                {publishedDate && <span>Publié le {publishedDate}</span>}
                {article.readTimeMinutes ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    {article.readTimeMinutes} min de lecture
                  </span>
                ) : null}
                {article.authorName && <span>par {article.authorName}</span>}
              </div>
            </div>

            {article.coverImageUrl && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <img
                  src={article.coverImageUrl}
                  alt=""
                  className="h-72 w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {youtubeId && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">Vidéo</h2>
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    title="Tutoriel vidéo"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            )}

            <div
              className="space-y-4 text-base leading-relaxed text-slate-800"
              dangerouslySetInnerHTML={{ __html: article.content || "" }}
            />
          </article>
        )}
      </div>
    </main>
  );
};

export default ArticleDetailPage;
