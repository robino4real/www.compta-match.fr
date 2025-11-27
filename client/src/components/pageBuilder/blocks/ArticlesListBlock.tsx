import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface ArticlesListBlockProps {
  data: any;
}

interface ArticlePreview {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
}

const ArticlesListBlock: React.FC<ArticlesListBlockProps> = ({ data }) => {
  const { title, mode = "latest", articleIds = [], maxItems = 3 } = data || {};
  const [articles, setArticles] = React.useState<ArticlePreview[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    const fetchArticles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/articles`);
        const json = await response.json().catch(() => ({}));
        const incoming = Array.isArray(json?.articles) ? json.articles : [];

        let selected = incoming as ArticlePreview[];
        if (mode === "selected" && articleIds.length > 0) {
          selected = incoming.filter((a: ArticlePreview) => articleIds.includes(a.id));
        }

        if (mode === "latest") {
          selected = incoming.slice(0, maxItems);
        } else {
          selected = selected.slice(0, maxItems);
        }

        if (isMounted) {
          setArticles(selected);
        }
      } catch (error) {
        console.error("Impossible de charger les articles", error);
      }
    };

    fetchArticles();

    return () => {
      isMounted = false;
    };
  }, [mode, articleIds, maxItems]);

  if (!articles.length) return null;

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-semibold text-black">{title}</h2>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <div
            key={article.id}
            className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 className="text-base font-semibold text-black">{article.title}</h3>
            {article.excerpt && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{article.excerpt}</p>
            )}
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-600">
              <a href={`/articles/${article.slug}`} className="hover:text-blue-500">
                Lire l’article
              </a>
              {article.publishedAt && (
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  {new Date(article.publishedAt).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlesListBlock;
