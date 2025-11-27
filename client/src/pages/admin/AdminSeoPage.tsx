import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface SeoSettings {
  id: number;
  siteName: string;
  siteTagline?: string | null;
  defaultTitle?: string | null;
  titleTemplate?: string | null;
  defaultMetaDescription?: string | null;
  defaultOgImageUrl?: string | null;
  twitterHandle?: string | null;
  facebookPageUrl?: string | null;
  linkedinPageUrl?: string | null;
  indexSite: boolean;
  defaultRobotsIndex?: string | null;
  defaultRobotsFollow?: string | null;
  canonicalBaseUrl?: string | null;
  customRobotsTxt?: string | null;
  enableSitemap: boolean;
}

interface SeoStaticPage {
  id: string;
  key: string;
  route: string;
  title?: string | null;
  metaDescription?: string | null;
  index: boolean;
  follow: boolean;
  ogImageUrl?: string | null;
}

const AdminSeoPage: React.FC = () => {
  const [settings, setSettings] = React.useState<SeoSettings | null>(null);
  const [staticPages, setStaticPages] = React.useState<SeoStaticPage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [staticPageMessage, setStaticPageMessage] = React.useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, staticPagesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/seo/settings`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/admin/seo/static-pages`, { credentials: "include" }),
      ]);

      const settingsData = await settingsRes.json().catch(() => ({}));
      const staticPagesData = await staticPagesRes.json().catch(() => ({}));

      if (!settingsRes.ok) {
        throw new Error(settingsData.message || "Impossible de charger les paramètres SEO.");
      }
      if (!staticPagesRes.ok) {
        throw new Error(staticPagesData.message || "Impossible de charger les pages statiques.");
      }

      setSettings(settingsData.settings as SeoSettings);
      setStaticPages(staticPagesData.pages as SeoStaticPage[]);
    } catch (err: any) {
      console.error("Erreur chargement SEO", err);
      setError(err?.message || "Erreur lors du chargement des paramètres SEO.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleSettingChange = (field: keyof SeoSettings, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setError(null);
      setSuccess(null);
      const response = await fetch(`${API_BASE_URL}/admin/seo/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible d'enregistrer les paramètres SEO.");
      }
      setSettings(data.settings as SeoSettings);
      setSuccess("Paramètres SEO enregistrés.");
    } catch (err: any) {
      console.error("Erreur sauvegarde SEO", err);
      setError(err?.message || "Impossible d'enregistrer les paramètres.");
    }
  };

  const handleStaticPageChange = (id: string, field: keyof SeoStaticPage, value: any) => {
    setStaticPages((prev) =>
      prev.map((page) => (page.id === id ? { ...page, [field]: value } : page))
    );
  };

  const handleStaticPageSave = async (page: SeoStaticPage) => {
    try {
      setStaticPageMessage(null);
      const response = await fetch(`${API_BASE_URL}/admin/seo/static-pages/${page.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de mettre à jour la page statique.");
      }
      setStaticPages((prev) =>
        prev.map((p) => (p.id === page.id ? (data.page as SeoStaticPage) : p))
      );
      setStaticPageMessage("Page statique mise à jour.");
    } catch (err: any) {
      console.error("Erreur mise à jour page statique", err);
      setStaticPageMessage(err?.message || "Impossible de mettre à jour la page.");
    }
  };

  if (isLoading) {
    return <p className="text-xs text-slate-600">Chargement des paramètres SEO...</p>;
  }

  if (!settings) {
    return <p className="text-xs text-red-600">{error || "Paramètres SEO introuvables."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black">SEO – Paramètres généraux</h1>
            <p className="text-xs text-slate-600">
              Configurez le titre par défaut, le template et les options d'indexation globales.
            </p>
          </div>
        </div>

        {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
        {success && <p className="mt-2 text-[11px] text-green-600">{success}</p>}

        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Nom du site</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.siteName}
              onChange={(e) => handleSettingChange("siteName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Baseline / accroche</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.siteTagline || ""}
              onChange={(e) => handleSettingChange("siteTagline", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Titre par défaut</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.defaultTitle || ""}
              onChange={(e) => handleSettingChange("defaultTitle", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Template de titre</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.titleTemplate || ""}
              onChange={(e) => handleSettingChange("titleTemplate", e.target.value)}
              placeholder="{{pageTitle}} | {{siteName}}"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-slate-600">Meta description par défaut</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.defaultMetaDescription || ""}
              onChange={(e) => handleSettingChange("defaultMetaDescription", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Image Open Graph par défaut</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.defaultOgImageUrl || ""}
              onChange={(e) => handleSettingChange("defaultOgImageUrl", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Handle Twitter</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.twitterHandle || ""}
              onChange={(e) => handleSettingChange("twitterHandle", e.target.value)}
              placeholder="@comptamatch"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Page Facebook</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.facebookPageUrl || ""}
              onChange={(e) => handleSettingChange("facebookPageUrl", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Page LinkedIn</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.linkedinPageUrl || ""}
              onChange={(e) => handleSettingChange("linkedinPageUrl", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Indexation globale</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.indexSite ? "true" : "false"}
              onChange={(e) => handleSettingChange("indexSite", e.target.value === "true")}
            >
              <option value="true">Autoriser l'indexation</option>
              <option value="false">Bloquer l'indexation (noindex)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Robots – index</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.defaultRobotsIndex || "index"}
              onChange={(e) => handleSettingChange("defaultRobotsIndex", e.target.value)}
            >
              <option value="index">index</option>
              <option value="noindex">noindex</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Robots – follow</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.defaultRobotsFollow || "follow"}
              onChange={(e) => handleSettingChange("defaultRobotsFollow", e.target.value)}
            >
              <option value="follow">follow</option>
              <option value="nofollow">nofollow</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">URL canonique de base</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.canonicalBaseUrl || ""}
              onChange={(e) => handleSettingChange("canonicalBaseUrl", e.target.value)}
              placeholder="https://www.compta-match.fr"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Activer le sitemap</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.enableSitemap ? "true" : "false"}
              onChange={(e) => handleSettingChange("enableSitemap", e.target.value === "true")}
            >
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-slate-600">robots.txt personnalisé</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settings.customRobotsTxt || ""}
              onChange={(e) => handleSettingChange("customRobotsTxt", e.target.value)}
              rows={4}
              placeholder="User-agent: *\nAllow: /"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Pages statiques & listing</h2>
            <p className="text-xs text-slate-600">Contrôlez les metas des pages sans modèle spécifique.</p>
          </div>
        </div>

        {staticPageMessage && (
          <p className="mt-2 text-[11px] text-slate-600">{staticPageMessage}</p>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-500">
                <th className="py-2 pr-4">Route</th>
                <th className="py-2 pr-4">Titre SEO</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Index</th>
                <th className="py-2 pr-4">Follow</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staticPages.map((page) => (
                <tr key={page.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-mono text-[12px] text-slate-700">{page.route}</td>
                  <td className="py-2 pr-4">
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={page.title || ""}
                      onChange={(e) => handleStaticPageChange(page.id, "title", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={page.metaDescription || ""}
                      onChange={(e) =>
                        handleStaticPageChange(page.id, "metaDescription", e.target.value)
                      }
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={page.index ? "true" : "false"}
                      onChange={(e) => handleStaticPageChange(page.id, "index", e.target.value === "true")}
                    >
                      <option value="true">index</option>
                      <option value="false">noindex</option>
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={page.follow ? "true" : "false"}
                      onChange={(e) => handleStaticPageChange(page.id, "follow", e.target.value === "true")}
                    >
                      <option value="true">follow</option>
                      <option value="false">nofollow</option>
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                      onClick={() => handleStaticPageSave(page)}
                    >
                      Enregistrer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSeoPage;
