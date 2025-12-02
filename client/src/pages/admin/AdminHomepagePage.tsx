import React from "react";
import { API_BASE_URL } from "../../config/api";

interface HomepageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonLink: string;
  heroIllustrationUrl: string;
  feature1Icon: string;
  feature1Title: string;
  feature1Text: string;
  feature2Icon: string;
  feature2Title: string;
  feature2Text: string;
  feature3Icon: string;
  feature3Title: string;
  feature3Text: string;
  heroTitleTag: string;
  heroSubtitleTag: string;
  heroButtonStyle: string;
  navbarLogoUrl?: string;
  faviconUrl?: string;
}

const DEFAULT_SETTINGS: HomepageSettings = {
  heroTitle: "L’aide à la comptabilité des TPE au meilleur prix.",
  heroSubtitle:
    "Centralisez votre gestion comptable simplement, soyez toujours à jour, et concentrez-vous sur l’essentiel : votre activité.",
  heroButtonLabel: "Découvrir nos logiciels",
  heroButtonLink: "#",
  heroIllustrationUrl:
    "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
  feature1Icon: "✓",
  feature1Title: "Outils simples & complets",
  feature1Text: "Des outils intuitifs pour suivre votre comptabilité au quotidien.",
  feature2Icon: "◎",
  feature2Title: "Tarifs transparents",
  feature2Text: "Des offres claires et sans surprise, adaptées aux TPE.",
  feature3Icon: "☎",
  feature3Title: "Support dédié & réactif",
  feature3Text: "Une équipe qui répond vite pour vous accompagner.",
  heroTitleTag: "h1",
  heroSubtitleTag: "p",
  heroButtonStyle: "primary",
  navbarLogoUrl: "",
  faviconUrl: "",
};

const AdminHomepagePage: React.FC = () => {
  const [settings, setSettings] = React.useState<HomepageSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/admin/homepage`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => DEFAULT_SETTINGS);
        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger la page d'accueil.");
        }
        setSettings({ ...DEFAULT_SETTINGS, ...(data as HomepageSettings) });
      } catch (err: any) {
        console.error("Erreur chargement homepage settings", err);
        setError(err?.message || "Erreur lors du chargement.");
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const updateField = (field: keyof HomepageSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setSuccess(null);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/homepage`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Impossible d'enregistrer la page d'accueil.");
      }
      setSettings({ ...DEFAULT_SETTINGS, ...(data as HomepageSettings) });
      setSuccess("Page d'accueil mise à jour.");
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde de la home", err);
      setError(err?.message || "Impossible d'enregistrer la page d'accueil.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderFeatureFields = (
    prefix: "feature1" | "feature2" | "feature3",
    label: string
  ) => (
    // TODO: brancher des icônes réelles côté front si besoin
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      {(() => {
        const iconKey = `${prefix}Icon` as keyof HomepageSettings;
        const titleKey = `${prefix}Title` as keyof HomepageSettings;
        const textKey = `${prefix}Text` as keyof HomepageSettings;

        return (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                Icône (placeholder)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings[iconKey]}
                  onChange={(e) => updateField(iconKey, e.target.value)}
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Titre
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings[titleKey]}
                  onChange={(e) => updateField(titleKey, e.target.value)}
                />
              </label>
            </div>
            <label className="text-xs font-medium text-slate-600">
              Description
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                value={settings[textKey]}
                onChange={(e) => updateField(textKey, e.target.value)}
              />
            </label>
          </>
        );
      })()}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Page d'accueil</h1>
        <p className="text-sm text-slate-600">
          Modifiez les textes et visuels de la page d’accueil publique.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
              Chargement…
            </div>
          ) : (
            <form onSubmit={save} className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="text-sm font-semibold text-slate-900">Identité visuelle</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-medium text-slate-600">
                    Logo de navigation (URL)
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={settings.navbarLogoUrl || ""}
                      onChange={(e) => updateField("navbarLogoUrl", e.target.value)}
                      placeholder="https://.../logo.png"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Favicon (URL)
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={settings.faviconUrl || ""}
                      onChange={(e) => updateField("faviconUrl", e.target.value)}
                      placeholder="https://.../favicon.ico"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  Le logo de navigation apparaît à gauche du titre dans la barre principale. Le favicon est utilisé pour l’icône
                  du site dans l’onglet du navigateur.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="text-sm font-semibold text-slate-900">Hero</div>
            <label className="text-xs font-medium text-slate-600">
              Titre principal
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={settings.heroTitle}
                onChange={(e) => updateField("heroTitle", e.target.value)}
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Sous-titre
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                value={settings.heroSubtitle}
                onChange={(e) => updateField("heroSubtitle", e.target.value)}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                Libellé du bouton
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.heroButtonLabel}
                  onChange={(e) => updateField("heroButtonLabel", e.target.value)}
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Lien du bouton (placeholder)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.heroButtonLink}
                  onChange={(e) => updateField("heroButtonLink", e.target.value)}
                />
              </label>
            </div>
            <label className="text-xs font-medium text-slate-600">
              URL de l’illustration
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={settings.heroIllustrationUrl}
                onChange={(e) => updateField("heroIllustrationUrl", e.target.value)}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs font-medium text-slate-600">
                Tag du titre (h1, h2…)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.heroTitleTag}
                  onChange={(e) => updateField("heroTitleTag", e.target.value)}
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Tag du sous-titre
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.heroSubtitleTag}
                  onChange={(e) => updateField("heroSubtitleTag", e.target.value)}
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Style du bouton
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.heroButtonStyle}
                  onChange={(e) => updateField("heroButtonStyle", e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-900">Cartes de mise en avant</div>
            <div className="grid gap-3 md:grid-cols-3">
              {renderFeatureFields("feature1", "Carte 1")}
              {renderFeatureFields("feature2", "Carte 2")}
              {renderFeatureFields("feature3", "Carte 3")}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminHomepagePage;
