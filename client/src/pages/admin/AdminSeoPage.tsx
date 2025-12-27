import React from "react";
import {
  GeoAnswerResponse,
  GeoFaqItemResponse,
  GeoIdentityResponse,
  DiagnosticsResponse,
  SeoSettingsResponse,
  createGeoAnswer,
  createGeoFaqItem,
  deleteGeoAnswer,
  deleteGeoFaqItem,
  fetchGeoAnswers,
  fetchGeoFaq,
  fetchGeoIdentity,
  fetchSeoSettings,
  reorderGeoAnswers,
  reorderGeoFaq,
  runSeoGeoDiagnostics,
  updateGeoAnswer,
  updateGeoFaqItem,
  updateGeoIdentity,
  updateSeoSettings,
} from "../../services/adminSeoGeoApi";

type TabKey = "seo" | "geo" | "diagnostics";

type TabDefinition = {
  key: TabKey;
  label: string;
};

const tabs: TabDefinition[] = [
  { key: "seo", label: "SEO (classique)" },
  { key: "geo", label: "GEO (IA)" },
  { key: "diagnostics", label: "Diagnostics" },
];

type SeoSettingsForm = {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImageUrl: string;
  canonicalBaseUrl: string;
  defaultRobotsIndex: boolean;
  defaultRobotsFollow: boolean;
  robotsTxt: string;
  sitemapEnabled: boolean;
  sitemapIncludePages: boolean;
  sitemapIncludeProducts: boolean;
  sitemapIncludeArticles: boolean;
};

type GeoIdentityForm = {
  shortDescription: string;
  longDescription: string;
  targetAudience: string;
  positioning: string;
  differentiation: string;
  brandTone: string;
  language: string;
};

const DEFAULT_BASE_URL = "https://www.compta-match.fr";

const toneOptions: { value: string; label: string }[] = [
  { value: "PROFESSIONAL", label: "Professionnel" },
  { value: "PEDAGOGICAL", label: "Pédagogique" },
  { value: "DIRECT", label: "Direct" },
];

const toInput = (value: string | null | undefined) => value ?? "";
const toBoolean = (value: boolean | null | undefined, fallback = true) =>
  typeof value === "boolean" ? value : fallback;
const normalizeString = (value: string | null | undefined) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const buildRobotsTemplate = (baseUrl?: string) =>
  `User-agent: *\nAllow: /\nSitemap: ${
    baseUrl?.trim().length ? baseUrl.replace(/\/$/, "") : DEFAULT_BASE_URL
  }/sitemap.xml`;

const buildSnippetPreview = (seoSettings: SeoSettingsForm | null) => {
  const baseUrl = (seoSettings?.canonicalBaseUrl || DEFAULT_BASE_URL).replace(
    /\/$/,
    ""
  );
  const title =
    seoSettings?.defaultTitle || seoSettings?.siteName || "Titre de la page";
  const description =
    seoSettings?.defaultDescription || "Meta description en quelques mots.";

  return {
    title,
    description,
    url: `${baseUrl || DEFAULT_BASE_URL}/` || DEFAULT_BASE_URL,
  };
};

const readinessBadge = (diagnostics?: DiagnosticsResponse | null) => {
  if (!diagnostics)
    return {
      label: "Diagnostic en attente",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
    };

  if (diagnostics.summary.errors > 0)
    return {
      label: "Indexation bloquée",
      tone: "bg-red-50 text-red-700 border-red-200",
    };
  if (diagnostics.summary.warnings > 0)
    return {
      label: "Indexation à améliorer",
      tone: "bg-amber-50 text-amber-800 border-amber-200",
    };
  return { label: "Indexation OK", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

function mapSeoSettingsToForm(data: SeoSettingsResponse): SeoSettingsForm {
  return {
    siteName: toInput(data.siteName),
    defaultTitle: toInput(data.defaultTitle),
    defaultDescription: toInput(data.defaultDescription),
    defaultOgImageUrl: toInput(data.defaultOgImageUrl),
    canonicalBaseUrl: toInput(data.canonicalBaseUrl) || DEFAULT_BASE_URL,
    defaultRobotsIndex: toBoolean(data.defaultRobotsIndex, true),
    defaultRobotsFollow: toBoolean(data.defaultRobotsFollow, true),
    robotsTxt: toInput(data.robotsTxt) || buildRobotsTemplate(data.canonicalBaseUrl),
    sitemapEnabled: toBoolean(data.sitemapEnabled, true),
    sitemapIncludePages: toBoolean(data.sitemapIncludePages, true),
    sitemapIncludeProducts: toBoolean(data.sitemapIncludeProducts, true),
    sitemapIncludeArticles: toBoolean(data.sitemapIncludeArticles, false),
  };
}

function mapGeoIdentityToForm(data: GeoIdentityResponse): GeoIdentityForm {
  return {
    shortDescription: toInput(data.shortDescription),
    longDescription: toInput(data.longDescription),
    targetAudience: toInput(data.targetAudience),
    positioning: toInput(data.positioning),
    differentiation: toInput(data.differentiation),
    brandTone: data.brandTone || toneOptions[1].value,
    language: data.language || "fr",
  };
}

const AdminSeoPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabKey>("seo");
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [seoError, setSeoError] = React.useState<string | null>(null);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [faqError, setFaqError] = React.useState<string | null>(null);
  const [answersError, setAnswersError] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [savingSeo, setSavingSeo] = React.useState(false);
  const [savingGeo, setSavingGeo] = React.useState(false);
  const [isAddingFaq, setIsAddingFaq] = React.useState(false);
  const [isAddingAnswer, setIsAddingAnswer] = React.useState(false);
  const [isReorderingFaq, setIsReorderingFaq] = React.useState(false);
  const [isReorderingAnswers, setIsReorderingAnswers] = React.useState(false);

  const [savingFaqIds, setSavingFaqIds] = React.useState<Record<string, boolean>>({});
  const [savingAnswerIds, setSavingAnswerIds] = React.useState<Record<string, boolean>>({});

  const [seoSettings, setSeoSettings] = React.useState<SeoSettingsForm | null>(
    null
  );
  const [geoIdentity, setGeoIdentity] = React.useState<GeoIdentityForm | null>(
    null
  );
  const [faqItems, setFaqItems] = React.useState<GeoFaqItemResponse[]>([]);
  const [answers, setAnswers] = React.useState<GeoAnswerResponse[]>([]);
  const [diagnostics, setDiagnostics] = React.useState<DiagnosticsResponse | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = React.useState(false);
  const [diagnosticsError, setDiagnosticsError] = React.useState<string | null>(null);
  const [hasRequestedDiagnostics, setHasRequestedDiagnostics] = React.useState(false);
  const [faqJsonCopied, setFaqJsonCopied] = React.useState(false);

  const showToast = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
    if (event.key === "ArrowRight") {
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].key);
      event.preventDefault();
    }
    if (event.key === "ArrowLeft") {
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].key);
      event.preventDefault();
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [seoRes, geoRes, faqRes, answersRes] = await Promise.all([
        fetchSeoSettings(),
        fetchGeoIdentity(),
        fetchGeoFaq(),
        fetchGeoAnswers(),
      ]);

      setSeoSettings(mapSeoSettingsToForm(seoRes.data));
      setGeoIdentity(mapGeoIdentityToForm(geoRes.data));
      setFaqItems(Array.isArray(faqRes.data) ? faqRes.data : []);
      setAnswers(Array.isArray(answersRes.data) ? answersRes.data : []);
    } catch (error: any) {
      setLoadError(error?.message || "Impossible de charger les données.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const loadDiagnostics = async () => {
    try {
      setDiagnosticsLoading(true);
      setDiagnosticsError(null);
      const res = await runSeoGeoDiagnostics();
      setDiagnostics(res.data);
      setHasRequestedDiagnostics(true);
    } catch (error: any) {
      setDiagnosticsError(error?.message || "Impossible de lancer les diagnostics.");
    } finally {
      setDiagnosticsLoading(false);
      setHasRequestedDiagnostics(true);
    }
  };

  React.useEffect(() => {
    if (activeTab === "diagnostics" && !diagnostics && !diagnosticsLoading) {
      loadDiagnostics();
    }
  }, [activeTab, diagnostics, diagnosticsLoading]);

  React.useEffect(() => {
    if (!hasRequestedDiagnostics) {
      loadDiagnostics();
    }
  }, [hasRequestedDiagnostics]);

  const handleSeoChange = (field: keyof SeoSettingsForm, value: any) => {
    setSeoSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const submitSeoUpdate = async (
    payload: Partial<SeoSettingsResponse>,
    successMessage = "Enregistré"
  ) => {
    try {
      setSavingSeo(true);
      setSeoError(null);
      const response = await updateSeoSettings(payload);
      setSeoSettings(mapSeoSettingsToForm(response.data));
      showToast(response.message || successMessage);
    } catch (error: any) {
      setSeoError(error?.message || "Erreur lors de l'enregistrement SEO.");
    } finally {
      setSavingSeo(false);
    }
  };

  const handleSaveSeoGlobal = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!seoSettings) return;

    await submitSeoUpdate({
      siteName: normalizeString(seoSettings.siteName),
      defaultTitle: normalizeString(seoSettings.defaultTitle),
      defaultDescription: normalizeString(seoSettings.defaultDescription),
      defaultOgImageUrl: normalizeString(seoSettings.defaultOgImageUrl),
      canonicalBaseUrl: normalizeString(seoSettings.canonicalBaseUrl),
      defaultRobotsIndex: seoSettings.defaultRobotsIndex,
      defaultRobotsFollow: seoSettings.defaultRobotsFollow,
    });
  };

  const handleSaveRobots = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!seoSettings) return;

    await submitSeoUpdate({ robotsTxt: normalizeString(seoSettings.robotsTxt) });
  };

  const handleResetRobots = () => {
    setSeoSettings((prev) =>
      prev
        ? { ...prev, robotsTxt: buildRobotsTemplate(prev.canonicalBaseUrl) }
        : prev
    );
  };

  const handleSaveSitemap = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!seoSettings) return;

    await submitSeoUpdate({
      sitemapEnabled: seoSettings.sitemapEnabled,
      sitemapIncludePages: seoSettings.sitemapIncludePages,
      sitemapIncludeProducts: seoSettings.sitemapIncludeProducts,
      sitemapIncludeArticles: seoSettings.sitemapIncludeArticles,
    });
  };

  const handleGeoIdentityChange = (
    field: keyof GeoIdentityForm,
    value: string
  ) => {
    setGeoIdentity((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveGeoIdentity = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!geoIdentity) return;

    try {
      setSavingGeo(true);
      setGeoError(null);
      const response = await updateGeoIdentity({
        shortDescription: normalizeString(geoIdentity.shortDescription),
        longDescription: normalizeString(geoIdentity.longDescription),
        targetAudience: normalizeString(geoIdentity.targetAudience),
        positioning: normalizeString(geoIdentity.positioning),
        differentiation: normalizeString(geoIdentity.differentiation),
        brandTone: geoIdentity.brandTone,
        language: geoIdentity.language,
      });
      setGeoIdentity(mapGeoIdentityToForm(response.data));
      showToast(response.message || "Identité IA enregistrée");
    } catch (error: any) {
      setGeoError(error?.message || "Erreur lors de l'enregistrement GEO.");
    } finally {
      setSavingGeo(false);
    }
  };

  const handleAddFaq = async () => {
    try {
      setIsAddingFaq(true);
      setFaqError(null);
      const response = await createGeoFaqItem({
        question: "Nouvelle question",
        answer: "Réponse à renseigner.",
      });
      setFaqItems((prev) => [...prev, response.data]);
      showToast("Élément FAQ ajouté");
    } catch (error: any) {
      setFaqError(error?.message || "Impossible d'ajouter la FAQ.");
    } finally {
      setIsAddingFaq(false);
    }
  };

  const handleFaqChange = (id: string, field: keyof GeoFaqItemResponse, value: string) => {
    setFaqItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveFaqItem = async (id: string) => {
    const target = faqItems.find((item) => item.id === id);
    if (!target) return;

    setSavingFaqIds((prev) => ({ ...prev, [id]: true }));
    setFaqError(null);
    try {
      const response = await updateGeoFaqItem(id, {
        question: normalizeString(target.question),
        answer: normalizeString(target.answer),
      });
      setFaqItems((prev) =>
        prev.map((item) => (item.id === id ? response.data : item))
      );
      showToast("FAQ mise à jour");
    } catch (error: any) {
      setFaqError(error?.message || "Erreur lors de la sauvegarde de la FAQ.");
    } finally {
      setSavingFaqIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRemoveFaq = async (id: string) => {
    const confirmDelete = window.confirm("Supprimer cette question ?");
    if (!confirmDelete) return;

    setSavingFaqIds((prev) => ({ ...prev, [id]: true }));
    setFaqError(null);
    try {
      await deleteGeoFaqItem(id);
      setFaqItems((prev) => prev.filter((item) => item.id !== id));
      showToast("FAQ supprimée");
    } catch (error: any) {
      setFaqError(error?.message || "Erreur lors de la suppression de la FAQ.");
    } finally {
      setSavingFaqIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMoveFaq = async (id: string, direction: "up" | "down") => {
    if (faqItems.length === 0) return;
    const index = faqItems.findIndex((item) => item.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= faqItems.length) return;

    const reordered = [...faqItems];
    [reordered[index], reordered[swapIndex]] = [
      reordered[swapIndex],
      reordered[index],
    ];

    setFaqItems(reordered);
    setIsReorderingFaq(true);
    try {
      const response = await reorderGeoFaq(reordered.map((item) => item.id));
      setFaqItems(response.data);
      showToast("FAQ réordonnée");
    } catch (error: any) {
      setFaqError(error?.message || "Erreur lors du réordonnancement de la FAQ.");
      setFaqItems(faqItems);
    } finally {
      setIsReorderingFaq(false);
    }
  };

  const handleAddResponse = async () => {
    try {
      setIsAddingAnswer(true);
      setAnswersError(null);
      const response = await createGeoAnswer({
        question: "Nouvelle question",
        shortAnswer: "Réponse courte",
        longAnswer: "Réponse longue à détailler.",
      });
      setAnswers((prev) => [...prev, response.data]);
      showToast("Réponse ajoutée");
    } catch (error: any) {
      setAnswersError(error?.message || "Impossible d'ajouter la réponse.");
    } finally {
      setIsAddingAnswer(false);
    }
  };

  const handleResponseChange = (
    id: string,
    field: keyof GeoAnswerResponse,
    value: string
  ) => {
    setAnswers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveResponse = async (id: string) => {
    const target = answers.find((item) => item.id === id);
    if (!target) return;

    setSavingAnswerIds((prev) => ({ ...prev, [id]: true }));
    setAnswersError(null);
    try {
      const response = await updateGeoAnswer(id, {
        question: normalizeString(target.question),
        shortAnswer: normalizeString(target.shortAnswer),
        longAnswer: normalizeString(target.longAnswer),
      });
      setAnswers((prev) =>
        prev.map((item) => (item.id === id ? response.data : item))
      );
      showToast("Réponse mise à jour");
    } catch (error: any) {
      setAnswersError(
        error?.message || "Erreur lors de la sauvegarde des réponses IA."
      );
    } finally {
      setSavingAnswerIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRemoveResponse = async (id: string) => {
    const confirmDelete = window.confirm("Supprimer cette réponse IA ?");
    if (!confirmDelete) return;

    setSavingAnswerIds((prev) => ({ ...prev, [id]: true }));
    setAnswersError(null);
    try {
      await deleteGeoAnswer(id);
      setAnswers((prev) => prev.filter((item) => item.id !== id));
      showToast("Réponse supprimée");
    } catch (error: any) {
      setAnswersError(
        error?.message || "Erreur lors de la suppression de la réponse IA."
      );
    } finally {
      setSavingAnswerIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMoveResponse = async (id: string, direction: "up" | "down") => {
    if (answers.length === 0) return;
    const index = answers.findIndex((item) => item.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= answers.length) return;

    const reordered = [...answers];
    [reordered[index], reordered[swapIndex]] = [
      reordered[swapIndex],
      reordered[index],
    ];

    setAnswers(reordered);
    setIsReorderingAnswers(true);
    try {
      const response = await reorderGeoAnswers(reordered.map((item) => item.id));
      setAnswers(response.data);
      showToast("Réponses réordonnées");
    } catch (error: any) {
      setAnswersError(
        error?.message || "Erreur lors du réordonnancement des réponses IA."
      );
      setAnswers(answers);
    } finally {
      setIsReorderingAnswers(false);
    }
  };

  const snippetPreview = React.useMemo(
    () => buildSnippetPreview(seoSettings),
    [seoSettings]
  );

  const canonicalBase = React.useMemo(
    () => (seoSettings?.canonicalBaseUrl || DEFAULT_BASE_URL).replace(/\/$/, ""),
    [seoSettings]
  );

  const faqJsonLd = React.useMemo(() => {
    if (!faqItems.length) return "";

    const payload = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    return JSON.stringify(payload, null, 2);
  }, [faqItems]);

  const handleCopyFaqJsonLd = async () => {
    if (!faqJsonLd) return;
    try {
      await navigator.clipboard?.writeText(faqJsonLd);
      setFaqJsonCopied(true);
      setTimeout(() => setFaqJsonCopied(false), 2000);
    } catch (error) {
      console.error("Clipboard copy failed", error);
    }
  };

  const iaSummaryPreview = React.useMemo(() => {
    if (!geoIdentity) return "Complétez l'identité IA pour générer un résumé.";
    const parts = [
      geoIdentity.shortDescription,
      geoIdentity.positioning,
      geoIdentity.targetAudience,
      geoIdentity.differentiation,
    ].filter(Boolean);

    const answersSnippets = answers
      .filter((item) => item.shortAnswer)
      .slice(0, 2)
      .map((item) => `• ${item.question}: ${item.shortAnswer}`);

    return [...parts, ...answersSnippets].filter(Boolean).join(" — ") ||
      "Complétez l'identité IA pour générer un résumé.";
  }, [answers, geoIdentity]);

  const handleOpenRobots = () => {
    window.open(`${canonicalBase || ""}/robots.txt`, "_blank");
  };

  const handleOpenSitemap = () => {
    window.open(`${canonicalBase || ""}/sitemap.xml`, "_blank");
  };

  const handleOpenInspect = () => {
    const property = encodeURIComponent(`${canonicalBase || DEFAULT_BASE_URL}/`);
    window.open(
      `https://search.google.com/search-console/inspect?resource_id=${property}`,
      "_blank"
    );
  };

  const renderTabButton = (tab: TabDefinition) => (
    <button
      key={tab.key}
      id={`${tab.key}-tab`}
      role="tab"
      aria-selected={activeTab === tab.key}
      aria-controls={`${tab.key}-panel`}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white ${
        activeTab === tab.key
          ? "bg-slate-900 text-white shadow"
          : "bg-white text-slate-700 border border-slate-200 hover:border-slate-400"
      }`}
      onClick={() => setActiveTab(tab.key)}
      onKeyDown={handleTabKeyDown}
      type="button"
    >
      {tab.label}
    </button>
  );

  const renderSeoTab = () => (
    <div id="seo-panel" role="tabpanel" aria-labelledby="seo-tab" className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Preview
            </p>
            <h2 className="text-lg font-semibold text-black">Extrait Google (live)</h2>
            <p className="text-xs text-slate-600">Mise à jour en temps réel selon vos champs par défaut.</p>
          </div>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
            {snippetPreview.url}
          </span>
        </div>
        <div className="mt-4 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-base font-semibold text-indigo-700">{snippetPreview.title}</p>
          <p className="text-xs text-emerald-700">{snippetPreview.url}</p>
          <p className="text-sm text-slate-800">{snippetPreview.description}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">SEO / GEO – Paramètres généraux</h2>
            <p className="text-xs text-slate-600">
              Configurez les champs par défaut et l'indexation globale avant de connecter l'API.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
              {savingSeo ? "Sauvegarde..." : "Données synchronisées"}
            </span>
          </div>
        </div>

        {seoError && <p className="text-[11px] text-red-600">{seoError}</p>}

        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSaveSeoGlobal}>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Nom du site</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={seoSettings?.siteName || ""}
              onChange={(e) => handleSeoChange("siteName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Titre méta par défaut</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={seoSettings?.defaultTitle || ""}
              onChange={(e) => handleSeoChange("defaultTitle", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-slate-600">Description méta par défaut</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={seoSettings?.defaultDescription || ""}
              onChange={(e) => handleSeoChange("defaultDescription", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Image OG par défaut</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={seoSettings?.defaultOgImageUrl || ""}
              onChange={(e) => handleSeoChange("defaultOgImageUrl", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">URL canonique de base</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={seoSettings?.canonicalBaseUrl || ""}
              onChange={(e) => handleSeoChange("canonicalBaseUrl", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Indexation globale</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={seoSettings?.defaultRobotsIndex ? "index" : "noindex"}
              onChange={(e) => handleSeoChange("defaultRobotsIndex", e.target.value === "index")}
            >
              <option value="index">Autoriser l'indexation</option>
              <option value="noindex">Bloquer (noindex)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Follow global</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={seoSettings?.defaultRobotsFollow ? "follow" : "nofollow"}
              onChange={(e) => handleSeoChange("defaultRobotsFollow", e.target.value === "follow")}
            >
              <option value="follow">follow</option>
              <option value="nofollow">nofollow</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSeo || isLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {savingSeo ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Robots.txt</h3>
            <p className="text-xs text-slate-600">
              Contenu éditable et aperçu rapide avant publication.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetRobots}
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-black hover:text-black"
            >
              Réinitialiser robots.txt
            </button>
            <button
              onClick={handleSaveRobots}
              disabled={savingSeo || isLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {savingSeo ? "Sauvegarde..." : "Enregistrer robots.txt"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Edition</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={seoSettings?.robotsTxt || ""}
              onChange={(e) => handleSeoChange("robotsTxt", e.target.value)}
              rows={8}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Prévisualisation</label>
            <pre className="h-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 whitespace-pre-wrap">
              {seoSettings?.robotsTxt}
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Sitemap</h3>
            <p className="text-xs text-slate-600">Sélectionnez les contenus à inclure.</p>
          </div>
          <button
            onClick={handleSaveSitemap}
            disabled={savingSeo || isLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {savingSeo ? "Sauvegarde..." : "Enregistrer sitemap"}
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-700">Activer le sitemap</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={!!seoSettings?.sitemapEnabled}
                onChange={(e) => handleSeoChange("sitemapEnabled", e.target.checked)}
              />
            </div>
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <label className="flex items-center justify-between text-sm text-slate-700">
                <span>Pages</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={!!seoSettings?.sitemapIncludePages}
                  onChange={(e) => handleSeoChange("sitemapIncludePages", e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between text-sm text-slate-700">
                <span>Produits</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={!!seoSettings?.sitemapIncludeProducts}
                  onChange={(e) => handleSeoChange("sitemapIncludeProducts", e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between text-sm text-slate-700 opacity-60">
                <span>Articles</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={!!seoSettings?.sitemapIncludeArticles}
                  onChange={(e) => handleSeoChange("sitemapIncludeArticles", e.target.checked)}
                  disabled
                />
              </label>
              <p className="text-[11px] text-slate-500">Articles sera connecté à l'API ultérieurement.</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs font-semibold text-slate-600">Chemins prévus</p>
            <ul className="mt-2 space-y-1 text-[13px]">
              <li>• /sitemap.xml</li>
              <li>• /sitemap-pages.xml</li>
              <li>• /sitemap-products.xml</li>
              <li className="text-slate-400">• /sitemap-articles.xml (bientôt)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeoTab = () => (
    <div id="geo-panel" role="tabpanel" aria-labelledby="geo-tab" className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Identité IA (Global)</h3>
            <p className="text-xs text-slate-600">
              Définissez le positionnement qui guidera les futures générations IA.
            </p>
          </div>
          <button
            onClick={handleSaveGeoIdentity}
            disabled={savingGeo || isLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {savingGeo ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
        {geoError && <p className="text-[11px] text-red-600">{geoError}</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Description courte</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={geoIdentity?.shortDescription || ""}
              onChange={(e) => handleGeoIdentityChange("shortDescription", e.target.value)}
              maxLength={240}
              rows={3}
            />
            <p className="text-[11px] text-slate-500">{geoIdentity?.shortDescription?.length || 0}/240</p>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Description longue</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={geoIdentity?.longDescription || ""}
              onChange={(e) => handleGeoIdentityChange("longDescription", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Public cible</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={geoIdentity?.targetAudience || ""}
              onChange={(e) => handleGeoIdentityChange("targetAudience", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Positionnement</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={geoIdentity?.positioning || ""}
              onChange={(e) => handleGeoIdentityChange("positioning", e.target.value)}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-slate-600">Différenciation</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={geoIdentity?.differentiation || ""}
              onChange={(e) => handleGeoIdentityChange("differentiation", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Ton de marque</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={geoIdentity?.brandTone || toneOptions[1].value}
              onChange={(e) => handleGeoIdentityChange("brandTone", e.target.value)}
            >
              {toneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Langue</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={geoIdentity?.language || ""}
              onChange={(e) => handleGeoIdentityChange("language", e.target.value)}
              placeholder="fr"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Prévisualisation IA</h3>
            <p className="text-xs text-slate-600">Résumé et FAQ JSON-LD simulés à partir de vos entrées.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={handleCopyFaqJsonLd}
              disabled={!faqJsonLd}
              className="rounded-full border border-slate-200 px-3 py-1 hover:border-black hover:text-black disabled:opacity-60"
            >
              {faqJsonCopied ? "Copié" : "Copier le FAQ JSON-LD"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Résumé IA</p>
            <p className="text-sm text-slate-800">{iaSummaryPreview}</p>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">FAQ JSON-LD</p>
            {faqJsonLd ? (
              <pre className="max-h-64 overflow-auto rounded border border-slate-200 bg-white p-3 text-[11px] text-slate-800">
                {faqJsonLd}
              </pre>
            ) : (
              <p className="text-sm text-slate-600">Ajoutez des entrées FAQ pour générer l'exemple JSON-LD.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">FAQ IA (Global)</h3>
            <p className="text-xs text-slate-600">
              Listez les questions/réponses mises à disposition de l'IA.
            </p>
          </div>
          <button
            onClick={handleAddFaq}
            disabled={isAddingFaq || isLoading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-black hover:text-black disabled:opacity-60"
          >
            {isAddingFaq ? "Ajout..." : "Ajouter une question"}
          </button>
        </div>
        {faqError && <p className="text-[11px] text-red-600">{faqError}</p>}
        <div className="mt-4 space-y-4">
          {faqItems.length === 0 && (
            <p className="text-sm text-slate-600">Aucune question pour le moment.</p>
          )}
          {faqItems.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">#{index + 1}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveFaq(item.id, "up")}
                    disabled={index === 0 || isReorderingFaq}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 hover:border-black hover:text-black disabled:opacity-60"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveFaq(item.id, "down")}
                    disabled={index === faqItems.length - 1 || isReorderingFaq}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 hover:border-black hover:text-black disabled:opacity-60"
                  >
                    ↓
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">Question</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={item.question}
                  onChange={(e) => handleFaqChange(item.id, "question", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">Réponse</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={item.answer}
                  onChange={(e) => handleFaqChange(item.id, "answer", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveFaqItem(item.id)}
                  disabled={!!savingFaqIds[item.id] || isLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingFaqIds[item.id] ? "Sauvegarde..." : "Sauvegarder"}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveFaq(item.id)}
                  disabled={!!savingFaqIds[item.id] || isLoading}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:border-red-400 disabled:opacity-60"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Réponses IA (Global)</h3>
            <p className="text-xs text-slate-600">
              Blocs Question / Réponse pour guider les suggestions IA.
            </p>
          </div>
          <button
            onClick={handleAddResponse}
            disabled={isAddingAnswer || isLoading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-black hover:text-black disabled:opacity-60"
          >
            {isAddingAnswer ? "Ajout..." : "Ajouter une réponse"}
          </button>
        </div>
        {answersError && <p className="text-[11px] text-red-600">{answersError}</p>}
        <div className="mt-4 space-y-4">
          {answers.length === 0 && (
            <p className="text-sm text-slate-600">Aucune réponse IA pour le moment.</p>
          )}
          {answers.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">#{index + 1}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveResponse(item.id, "up")}
                    disabled={index === 0 || isReorderingAnswers}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 hover:border-black hover:text-black disabled:opacity-60"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveResponse(item.id, "down")}
                    disabled={index === answers.length - 1 || isReorderingAnswers}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 hover:border-black hover:text-black disabled:opacity-60"
                  >
                    ↓
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">Question principale</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={item.question}
                  onChange={(e) => handleResponseChange(item.id, "question", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">Réponse courte</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={item.shortAnswer || ""}
                  onChange={(e) => handleResponseChange(item.id, "shortAnswer", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">Réponse longue</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={item.longAnswer || ""}
                  onChange={(e) => handleResponseChange(item.id, "longAnswer", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveResponse(item.id)}
                  disabled={!!savingAnswerIds[item.id] || isLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingAnswerIds[item.id] ? "Sauvegarde..." : "Sauvegarder"}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveResponse(item.id)}
                  disabled={!!savingAnswerIds[item.id] || isLoading}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:border-red-400 disabled:opacity-60"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDiagnosticsTab = () => {
    const groupedChecks = diagnostics?.checks.reduce<Record<string, DiagnosticsResponse["checks"]>>((acc, check) => {
      if (!acc[check.category]) acc[check.category] = [];
      acc[check.category].push(check);
      return acc;
    }, {}) || {};

    const topIssues = (diagnostics?.checks || [])
      .filter((check) => check.level !== "ok")
      .slice(0, 3);

    const levelBadge = (level: string) => {
      if (level === "error") return "bg-red-50 text-red-700 border-red-200";
      if (level === "warning") return "bg-amber-50 text-amber-700 border-amber-200";
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    };

    const levelLabel = (level: string) => {
      if (level === "error") return "Critique";
      if (level === "warning") return "Alerte";
      return "OK";
    };

    return (
      <div
        id="diagnostics-panel"
        role="tabpanel"
        aria-labelledby="diagnostics-tab"
        className="space-y-4"
      >
        {diagnostics && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Indexation
                </p>
                <h3 className="text-lg font-semibold text-black">Préparation à l'indexation</h3>
                <p className="text-xs text-slate-600">Principaux points issus du dernier diagnostic.</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${readinessBadge(diagnostics).tone}`}
              >
                {readinessBadge(diagnostics).label}
              </span>
            </div>
            {topIssues.length > 0 ? (
              <div className="mt-4 space-y-2">
                {topIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{issue.title}</p>
                      <p className="text-xs text-slate-700">{issue.message}</p>
                    </div>
                    {issue.action?.href && (
                      <a
                        className="inline-flex items-center justify-center rounded-lg border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700 hover:border-indigo-400"
                        href={issue.action.href}
                      >
                        {issue.action.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-emerald-700">Aucune alerte majeure détectée.</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Diagnostics SEO / GEO</h3>
            <p className="text-xs text-slate-600">Analyse rapide des blocages d'indexation et données IA.</p>
            {diagnostics?.generatedAt && (
              <p className="text-[11px] text-slate-500">Dernier lancement : {new Date(diagnostics.generatedAt).toLocaleString()}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {diagnosticsError && (
              <span className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                {diagnosticsError}
              </span>
            )}
            <button
              type="button"
              onClick={loadDiagnostics}
              disabled={diagnosticsLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {diagnosticsLoading ? "Analyse..." : "Relancer les diagnostics"}
            </button>
          </div>
        </div>

        {diagnosticsLoading && !diagnostics && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            Analyse en cours...
          </div>
        )}

        {!diagnosticsLoading && !diagnostics && !diagnosticsError && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            Aucun résultat pour l'instant. Lancez une analyse.
          </div>
        )}

        {diagnostics && (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase text-red-600">Erreurs</p>
                <p className="text-2xl font-bold text-red-700">{diagnostics.summary.errors}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase text-amber-700">Alertes</p>
                <p className="text-2xl font-bold text-amber-700">{diagnostics.summary.warnings}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-700">OK</p>
                <p className="text-2xl font-bold text-emerald-700">{diagnostics.summary.ok}</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(groupedChecks).map(([category, items]) => (
                <div key={category} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-black">{category}</h4>
                    <span className="text-[11px] text-slate-500">{items.length} contrôle(s)</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((check) => (
                      <div
                        key={check.id}
                        className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${levelBadge(check.level)}`}>
                              {levelLabel(check.level)}
                            </span>
                            <p className="text-sm font-semibold text-slate-900">{check.title}</p>
                          </div>
                          <p className="text-xs text-slate-700">{check.message}</p>
                          {check.meta && (check.meta as any).urlCount && (
                            <p className="text-[11px] text-slate-500">URLs dans le sitemap : {(check.meta as any).urlCount as number}</p>
                          )}
                          {check.meta && Array.isArray((check.meta as any).routes) && (
                            <p className="text-[11px] text-slate-500">
                              Exemples : {(check.meta as any).routes.join(", ")}
                            </p>
                          )}
                          {check.meta && Array.isArray((check.meta as any).slugs) && (
                            <p className="text-[11px] text-slate-500">
                              Produits : {(check.meta as any).slugs.join(", ")}
                            </p>
                          )}
                        </div>
                        {check.action?.href && (
                          <a
                            className="inline-flex items-center justify-center rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:border-indigo-400"
                            href={check.action.href}
                          >
                            {check.action.label}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const badge = readinessBadge(diagnostics);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-black">SEO / GEO</h1>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${badge.tone}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Structure prête à être connectée aux API : contenus, IA et diagnostics.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          {statusMessage && (
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
              {statusMessage}
            </span>
          )}
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={handleOpenRobots}
              className="rounded-full border border-slate-200 px-3 py-1 hover:border-black hover:text-black"
            >
              Ouvrir robots.txt
            </button>
            <button
              type="button"
              onClick={handleOpenSitemap}
              className="rounded-full border border-slate-200 px-3 py-1 hover:border-black hover:text-black"
            >
              Ouvrir sitemap.xml
            </button>
            <button
              type="button"
              onClick={handleOpenInspect}
              className="rounded-full border border-slate-200 px-3 py-1 hover:border-black hover:text-black"
            >
              Tester une URL (Inspect)
            </button>
            <button
              type="button"
              onClick={loadDiagnostics}
              disabled={diagnosticsLoading}
              className="rounded-full border border-indigo-200 px-3 py-1 text-indigo-700 hover:border-indigo-400 disabled:opacity-60"
            >
              {diagnosticsLoading ? "Analyse..." : "Relancer diagnostics"}
            </button>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center justify-between gap-2">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={loadData}
              className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:border-red-500"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Navigation SEO GEO">
        {tabs.map((tab) => renderTabButton(tab))}
      </div>

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
          Chargement des paramètres SEO / GEO...
        </div>
      )}

      {!isLoading && seoSettings && geoIdentity && (
        <>
          {activeTab === "seo" && renderSeoTab()}
          {activeTab === "geo" && renderGeoTab()}
          {activeTab === "diagnostics" && renderDiagnosticsTab()}
        </>
      )}
    </div>
  );
};

export default AdminSeoPage;
