import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface ArticleForm {
  title: string;
  slug: string;
  authorName: string;
  category: string;
  excerpt: string;
  coverImageUrl: string;
  readTimeMinutes: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  status: ArticleStatus;
  publishedAt?: string | null;
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const AdminArticleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const [form, setForm] = React.useState<ArticleForm>({
    title: "",
    slug: "",
    authorName: "",
    category: "",
    excerpt: "",
    coverImageUrl: "",
    readTimeMinutes: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
    status: "DRAFT",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadArticle = React.useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/articles/${id}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de charger cet article."
        );
      }

      const article = (data as { article: any }).article;
      setForm({
        title: article.title || "",
        slug: article.slug || "",
        authorName: article.authorName || "",
        category: article.category || "",
        excerpt: article.excerpt || "",
        coverImageUrl: article.coverImageUrl || "",
        readTimeMinutes: article.readTimeMinutes?.toString?.() || "",
        content: article.content || "",
        seoTitle: article.seoTitle || "",
        seoDescription: article.seoDescription || "",
        status: article.status || "DRAFT",
        publishedAt: article.publishedAt,
      });
    } catch (err: any) {
      console.error("Erreur lors du chargement de l'article", err);
      setError(
        err?.message || "Une erreur est survenue lors du chargement de l'article."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  const handleChange = (field: keyof ArticleForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title" && !prev.slug) {
        next.slug = slugify(value);
      }
      if (field === "slug") {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (statusOverride?: ArticleStatus) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const readTime = form.readTimeMinutes.trim()
        ? Number(form.readTimeMinutes)
        : null;

      if (form.readTimeMinutes.trim() && Number.isNaN(readTime)) {
        setError("Le temps de lecture doit être un nombre valide.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...form,
        readTimeMinutes: readTime,
        status:
          statusOverride === "DRAFT" && form.publishedAt
            ? form.status
            : statusOverride ?? form.status,
      };

      const response = await fetch(
        `${API_BASE_URL}/admin/articles${isNew ? "" : `/${id}`}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible d'enregistrer cet article."
        );
      }

      const saved = (data as { article: any }).article;
      setSuccess(data.message || "Article enregistré.");
      setForm((prev) => ({
        ...prev,
        status: saved?.status ?? prev.status,
        publishedAt: saved?.publishedAt ?? prev.publishedAt,
      }));

      if (isNew && saved?.id) {
        navigate(`/admin/articles/${saved.id}`, { replace: true });
      }
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement de l'article", err);
      setError(
        err?.message || "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishedLabel = form.publishedAt
    ? new Date(form.publishedAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Administration
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-black">
              {isNew ? "Ajouter un article" : "Modifier l'article"}
            </h1>
            <p className="text-xs text-slate-600">
              Saisie du titre, du permalien et du contenu avant publication.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
          >
            Retour
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isLoading && (
            <p className="text-xs text-slate-600">Chargement de l'article...</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-emerald-700">{success}</p>}

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Titre de l'article"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Lien permanent (slug)</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                <span className="text-slate-500">/articles/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", slugify(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  placeholder="comptabilite-micro-entreprise"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800">Résumé court</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Résumé affiché dans les listes et pour le SEO"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800">Contenu</label>
              <textarea
                value={form.content}
                onChange={(e) => handleChange("content", e.target.value)}
                rows={14}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Contenu principal de l'article (HTML ou texte avec mises en forme simples)."
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">SEO</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800">Titre SEO</label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => handleChange("seoTitle", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Si vide, le titre principal sera utilisé"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800">Description SEO</label>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => handleChange("seoDescription", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="150-160 caractères recommandés"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Statut de publication</h2>
              {publishedLabel && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  Publié le {publishedLabel}
                </span>
              )}
            </div>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => handleSubmit("DRAFT")}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black disabled:opacity-50"
              >
                Enregistrer le brouillon
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("PUBLISHED")}
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Publier
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("ARCHIVED")}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black disabled:opacity-50"
              >
                Archiver
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              >
                Mettre à jour
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800">Catégorie</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Comptabilité, Micro-entreprise..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800">Auteur</label>
              <input
                type="text"
                value={form.authorName}
                onChange={(e) => handleChange("authorName", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Nom affiché dans la liste"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800">Image mise en avant (URL)</label>
              <input
                type="text"
                value={form.coverImageUrl}
                onChange={(e) => handleChange("coverImageUrl", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800">Temps de lecture (minutes)</label>
              <input
                type="number"
                min="0"
                value={form.readTimeMinutes}
                onChange={(e) => handleChange("readTimeMinutes", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="8"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminArticleEditPage;
