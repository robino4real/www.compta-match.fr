import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { uploadAdminImage } from "../../lib/adminUpload";

interface HomepageSettings {
  seoTitle: string;
  seoDescription: string;
  seoImageUrl?: string;
}

const EMPTY_SETTINGS: HomepageSettings = {
  seoTitle: "",
  seoDescription: "",
  seoImageUrl: "",
};

const AdminHomepagePage: React.FC = () => {
  const [settings, setSettings] = useState<HomepageSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [homePageId, setHomePageId] = useState<string | null>(null);
  const [sectionsCount, setSectionsCount] = useState<number>(0);

  const ensureHomePageExists = useCallback(async () => {
    const listResponse = await fetch(`${API_BASE_URL}/admin/pages`, { credentials: "include" });
    const listData = await listResponse.json().catch(() => ({}));

    if (!listResponse.ok) {
      throw new Error(listData?.message || "Impossible de récupérer les pages.");
    }

    const pages = Array.isArray(listData.pages) ? listData.pages : [];
    let homePage = pages.find((page: any) => page.key === "HOME" || page.route === "/");

    if (!homePage) {
      const createResponse = await fetch(`${API_BASE_URL}/admin/pages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Page d'accueil",
          key: "HOME",
          route: "/",
          status: "ACTIVE",
        }),
      });
      const createData = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok) {
        throw new Error(createData?.message || "Impossible de créer la page d'accueil.");
      }
      homePage = createData.page;
    }

    setHomePageId(homePage.id);

    const detailResponse = await fetch(`${API_BASE_URL}/admin/pages/${homePage.id}`, {
      credentials: "include",
    });
    const detailData = await detailResponse.json().catch(() => ({}));
    if (detailResponse.ok && detailData?.page?.sections) {
      setSectionsCount(Array.isArray(detailData.page.sections) ? detailData.page.sections.length : 0);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await ensureHomePageExists();

        const response = await fetch(`${API_BASE_URL}/admin/homepage`, { credentials: "include" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger les réglages.");
        }

        setSettings({
          ...EMPTY_SETTINGS,
          seoTitle: (data as any).seoTitle || "",
          seoDescription: (data as any).seoDescription || "",
          seoImageUrl: (data as any).heroIllustrationUrl || "",
        });
      } catch (err: any) {
        console.error("Erreur chargement page d'accueil", err);
        setError(err?.message || "Impossible de charger la page d'accueil.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ensureHomePageExists]);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onDone: (url: string) => void,
    key: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingKey(key);
    try {
      const upload = await uploadAdminImage(file);
      onDone(upload.url);
    } catch (err: any) {
      console.error("Erreur upload homepage", err);
      setError(err?.message || "Impossible de téléverser ce fichier.");
    } finally {
      setUploadingKey(null);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = {
        seoTitle: settings.seoTitle,
        seoDescription: settings.seoDescription,
        heroIllustrationUrl: settings.seoImageUrl,
      };
      const response = await fetch(`${API_BASE_URL}/admin/homepage`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Impossible d'enregistrer la page d'accueil.");
      }
      setSettings({
        ...EMPTY_SETTINGS,
        seoTitle: (data as any).seoTitle || "",
        seoDescription: (data as any).seoDescription || "",
        seoImageUrl: (data as any).heroIllustrationUrl || "",
      });
      setSuccess("Réglages mis à jour. Le contenu se mettra à jour en front après publication dans le Page Builder.");
    } catch (err: any) {
      console.error("Erreur sauvegarde homepage", err);
      setError(err?.message || "Impossible d'enregistrer la page d'accueil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Page d'accueil</h1>
          <p className="text-sm text-slate-600">
            Configurez le branding et le SEO, puis construisez le contenu depuis le Page Builder.
          </p>
        </div>
        {homePageId && (
          <Link
            to={`/admin/pages/${homePageId}`}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900"
          >
            Ouvrir le builder
          </Link>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Contenu piloté par le Page Builder</p>
            <p className="text-xs text-slate-500">
              Les sections et blocs affichés sur la home proviennent de la page "HOME" du builder.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{sectionsCount} sections</span>
            {homePageId && (
              <Link
                to={`/admin/pages/${homePageId}`}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold hover:border-black hover:text-black"
              >
                Modifier dans le builder
              </Link>
            )}
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Chaque modification enregistrée dans le builder est utilisée par l'API publique /api/public/homepage.
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Chargement…
        </div>
      ) : (
        <form onSubmit={save} className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">SEO</p>
                <p className="text-xs text-slate-500">Balises title/description et visuel OpenGraph pour la home.</p>
              </div>
            </div>
            <label className="text-xs font-medium text-slate-700">
              Title (balise &lt;title&gt;)
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={settings.seoTitle}
                onChange={(e) => setSettings((prev) => ({ ...prev, seoTitle: e.target.value }))}
                placeholder="ComptaMatch | Solutions comptables"
              />
            </label>
            <label className="text-xs font-medium text-slate-700">
              Meta description
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                value={settings.seoDescription}
                onChange={(e) => setSettings((prev) => ({ ...prev, seoDescription: e.target.value }))}
                placeholder="Description succincte de la page d'accueil"
              />
            </label>
            <label className="text-xs font-medium text-slate-700">
              Image OpenGraph (URL)
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={settings.seoImageUrl || ""}
                onChange={(e) => setSettings((prev) => ({ ...prev, seoImageUrl: e.target.value }))}
                placeholder="https://.../og-image.png"
              />
              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, (url) => setSettings((prev) => ({ ...prev, seoImageUrl: url })), "og")}
                  className="text-[11px]"
                />
                {uploadingKey === "og" && <span>Import en cours…</span>}
                {settings.seoImageUrl && (
                  <img src={settings.seoImageUrl} alt="Visuel OpenGraph" className="h-10 w-10 rounded object-contain ring-1 ring-slate-200" />
                )}
              </div>
            </label>
          </section>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              onClick={() => setSettings(EMPTY_SETTINGS)}
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminHomepagePage;
