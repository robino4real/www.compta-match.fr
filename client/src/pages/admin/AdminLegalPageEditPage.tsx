import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface LegalPageDetail {
  id: string;
  key: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt?: string;
}

const AdminLegalPageEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [page, setPage] = React.useState<LegalPageDetail | null>(null);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isPublished, setIsPublished] = React.useState(false);
  const [content, setContent] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadPage = React.useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/legal-pages/${id}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de charger la page légale demandée."
        );
      }

      const pageData = data.page as LegalPageDetail;
      setPage(pageData);
      setTitle(pageData.title);
      setSlug(pageData.slug);
      setIsPublished(Boolean(pageData.isPublished));
      setContent(pageData.content || "");
    } catch (err: any) {
      console.error("Erreur lors du chargement de la page légale", err);
      setError(
        err?.message || "Une erreur est survenue lors du chargement de la page."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);
      setSaveError(null);

      const payload = {
        title: title.trim() || page?.title,
        slug: slug.trim() || page?.slug,
        isPublished,
        content,
      };

      const response = await fetch(`${API_BASE_URL}/admin/legal-pages/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible d'enregistrer la page.");
      }

      const updated = data.page as LegalPageDetail;
      setPage(updated);
      setTitle(updated.title);
      setSlug(updated.slug);
      setIsPublished(Boolean(updated.isPublished));
      setContent(updated.content || "");
      setSaveMessage(data.message || "Page légale mise à jour.");
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement de la page légale", err);
      setSaveError(
        err?.message || "Impossible d'enregistrer la page légale pour le moment."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => navigate("/admin/legal-pages");

  const titleHelp =
    page?.key === "MENTIONS_LEGALES"
      ? "Renseignez les informations sur l'éditeur du site, l'hébergeur et les contacts."
      : page?.key === "CGV"
      ? "Décrivez les conditions de vente, paiement, rétractation et garanties."
      : page?.key === "CONFIDENTIALITE"
      ? "Expliquez la collecte, l'usage et la conservation des données personnelles."
      : "Précisez l'usage des cookies et traceurs, leur finalité et la gestion du consentement.";

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-black">Édition d'une page légale</h1>
          <p className="text-xs text-slate-600">
            Mettez à jour le titre, le slug, la publication et le contenu HTML de cette page légale.
          </p>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
        >
          Retour à la liste
        </button>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {isLoading && (
          <p className="text-xs text-slate-600">Chargement des informations...</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}

        {!isLoading && !error && page && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {saveMessage && (
              <p className="text-xs text-emerald-600">{saveMessage}</p>
            )}
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-semibold">Titre</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  required
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-semibold">Slug (URL)</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  required
                />
                <span className="text-[11px] text-slate-500">
                  L&apos;URL publique associée à la page (ex: /{slug || "mon-url"}).
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                />
                <span className="font-semibold">Rendre la page visible publiquement</span>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">Contenu HTML</span>
                <span className="text-[11px] text-slate-500">{titleHelp}</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-black focus:outline-none"
                placeholder="Saisissez ou collez le contenu HTML complet de la page."
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default AdminLegalPageEditPage;
