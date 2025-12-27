import React from "react";
import {
  PageSeoResponse,
  ProductSeoResponse,
  SeoSettingsResponse,
  fetchPageSeo,
  fetchProductSeo,
  fetchSeoSettings,
  updatePageSeo,
  updateProductSeo,
} from "../../services/adminSeoGeoApi";

let cachedSeoDefaults: SeoSettingsResponse | null = null;

function toInput(value: string | null | undefined) {
  return value ?? "";
}

function normalizeString(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

type RobotsChoice = "inherit" | "index" | "noindex";

type OverrideForm = {
  title: string;
  description: string;
  ogImageUrl: string;
  canonicalUrl: string;
  robotsIndex: RobotsChoice;
  robotsFollow: RobotsChoice;
};

type TargetType = "page" | "product";

type Props = {
  targetType: TargetType;
  targetId: string;
  targetLabel?: string;
  className?: string;
};

const robotsOptions: { value: RobotsChoice; label: string }[] = [
  { value: "inherit", label: "Hériter du global" },
  { value: "index", label: "Indexer" },
  { value: "noindex", label: "Noindex" },
];

function mapRobotsValue(value: boolean | null | undefined): RobotsChoice {
  if (value === true) return "index";
  if (value === false) return "noindex";
  return "inherit";
}

function robotsPayload(value: RobotsChoice) {
  if (value === "inherit") return null;
  if (value === "index") return true;
  return false;
}

function mapOverride(
  data: PageSeoResponse | ProductSeoResponse | null | undefined
): OverrideForm {
  return {
    title: toInput(data?.title),
    description: toInput(data?.description),
    ogImageUrl: toInput(data?.ogImageUrl),
    canonicalUrl: toInput(data?.canonicalUrl),
    robotsIndex: mapRobotsValue(data?.robotsIndex),
    robotsFollow: mapRobotsValue(data?.robotsFollow),
  };
}

function lengthWarning(label: string, value: string, threshold: number) {
  if (value && value.length > threshold) {
    return `${label} dépasse ${threshold} caractères (${value.length}).`; //
  }
  return null;
}

const SeoOverrideEditor: React.FC<Props> = ({
  targetId,
  targetType,
  targetLabel,
  className,
}) => {
  const [defaults, setDefaults] = React.useState<SeoSettingsResponse | null>(
    null
  );
  const [form, setForm] = React.useState<OverrideForm | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const preview = React.useMemo(() => {
    const base = (form?.canonicalUrl || defaults?.canonicalBaseUrl || "https://www.compta-match.fr").replace(
      /\/$/,
      ""
    );
    const slugHint = targetLabel?.toLowerCase().replace(/\s+/g, "-") || targetId;
    const fallbackPath = `/${targetType === "page" ? "page" : "produit"}-${slugHint}`;
    return {
      title:
        (form?.title && form.title.trim()) ||
        defaults?.defaultTitle ||
        defaults?.siteName ||
        "Titre de la page",
      description:
        (form?.description && form.description.trim()) ||
        defaults?.defaultDescription ||
        "Description de la page.",
      url: form?.canonicalUrl || `${base}${fallbackPath}`,
    };
  }, [defaults, form, targetId, targetLabel, targetType]);

  const loadData = React.useCallback(async () => {
    if (!targetId) return;
    try {
      setIsLoading(true);
      setError(null);

      let seoDefaults = cachedSeoDefaults;
      if (!seoDefaults) {
        const settingsRes = await fetchSeoSettings();
        seoDefaults = settingsRes.data;
        cachedSeoDefaults = seoDefaults;
      }
      setDefaults(seoDefaults);

      if (targetType === "page") {
        const response = await fetchPageSeo(targetId);
        setForm(mapOverride(response.data));
      } else {
        const response = await fetchProductSeo(targetId);
        setForm(mapOverride(response.data));
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de charger le SEO.");
    } finally {
      setIsLoading(false);
    }
  }, [targetId, targetType]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (field: keyof OverrideForm, value: any) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleReset = () => {
    setForm(mapOverride(null));
    setStatus(null);
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      setIsSaving(true);
      setStatus(null);
      setError(null);

      const payload = {
        title: normalizeString(form.title),
        description: normalizeString(form.description),
        ogImageUrl: normalizeString(form.ogImageUrl),
        canonicalUrl: normalizeString(form.canonicalUrl),
        robotsIndex: robotsPayload(form.robotsIndex),
        robotsFollow: robotsPayload(form.robotsFollow),
      };

      const response =
        targetType === "page"
          ? await updatePageSeo(targetId, payload)
          : await updateProductSeo(targetId, payload);

      setForm(mapOverride(response.data));
      setStatus("Enregistré");
    } catch (err: any) {
      setError(err?.message || "Impossible d'enregistrer le SEO.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!targetId) return null;

  const titleWarn = form ? lengthWarning("Le titre", form.title, 70) : null;
  const descWarn = form ? lengthWarning("La description", form.description, 180) : null;

  return (
    <section
      className={`space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            SEO personnalisé
          </p>
          <h2 className="text-lg font-semibold text-black">
            {targetType === "page" ? "Page" : "Produit"} : {targetLabel || targetId}
          </h2>
          <p className="text-xs text-slate-600">
            Définissez des métadonnées spécifiques ou laissez vide pour hériter des paramètres globaux.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={loadData}
            className="rounded-full border border-slate-200 px-3 py-2 text-slate-700 transition hover:border-black hover:text-black"
            disabled={isLoading}
          >
            {isLoading ? "Chargement..." : "Rafraîchir"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-slate-200 px-3 py-2 text-slate-700 transition hover:border-black hover:text-black"
            disabled={isSaving || isLoading}
          >
            Réinitialiser (hériter)
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="rounded-full bg-black px-4 py-2 text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {status && <p className="text-xs font-semibold text-emerald-700">{status}</p>}
      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}

      {isLoading && (
        <p className="text-xs text-slate-600">Chargement des données SEO...</p>
      )}

      {defaults && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-800">Valeurs globales (défaut)</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-600">Titre par défaut</p>
              <p className="font-semibold text-slate-900">{defaults.defaultTitle || "—"}</p>
              <p className="text-[11px] text-slate-600">Description</p>
              <p className="font-semibold text-slate-900">{defaults.defaultDescription || "—"}</p>
              <p className="text-[11px] text-slate-600">Image OG</p>
              <p className="font-semibold text-slate-900">{defaults.defaultOgImageUrl || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-slate-600">Canonique de base</p>
              <p className="font-semibold text-slate-900">{defaults.canonicalBaseUrl || "—"}</p>
              <p className="text-[11px] text-slate-600">Robots (index/follow)</p>
              <p className="font-semibold text-slate-900">
                {defaults.defaultRobotsIndex ? "index" : "noindex"} / {" "}
                {defaults.defaultRobotsFollow ? "follow" : "nofollow"}
              </p>
              <p className="text-[11px] text-slate-600">Sitemap</p>
              <p className="font-semibold text-slate-900">
                {defaults.sitemapEnabled ? "Activé" : "Désactivé"}
              </p>
            </div>
          </div>
        </div>
      )}

      {form && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Prévisualisation Google</p>
            <div className="mt-2 space-y-1 rounded border border-slate-200 bg-white p-3">
              <p className="text-base font-semibold text-indigo-700">{preview.title}</p>
              <p className="text-xs text-emerald-700">{preview.url}</p>
              <p className="text-sm text-slate-800">{preview.description}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Meta title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="Hériter du global si vide"
              />
              {titleWarn && <p className="text-[11px] text-amber-600">{titleWarn}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Meta description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="Hériter du global si vide"
              />
              {descWarn && <p className="text-[11px] text-amber-600">{descWarn}</p>}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">OG image URL</label>
              <input
                type="text"
                value={form.ogImageUrl}
                onChange={(e) => handleChange("ogImageUrl", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">URL canonique</label>
              <input
                type="text"
                value={form.canonicalUrl}
                onChange={(e) => handleChange("canonicalUrl", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Robots - Index</label>
              <select
                value={form.robotsIndex}
                onChange={(e) => handleChange("robotsIndex", e.target.value as RobotsChoice)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                {robotsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Robots - Follow</label>
              <select
                value={form.robotsFollow}
                onChange={(e) => handleChange("robotsFollow", e.target.value as RobotsChoice)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                {robotsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SeoOverrideEditor;
