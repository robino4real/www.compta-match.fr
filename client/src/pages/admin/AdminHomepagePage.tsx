import React from "react";
import { API_BASE_URL } from "../../config/api";
import { uploadAdminImage } from "../../lib/adminUpload";
import { HomepageContentBlock, HomepageFeature, HomepageHeroSection } from "../../types/homepage";

interface HomepageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonLink: string;
  heroIllustrationUrl: string;
  heroTitleTag: string;
  heroSubtitleTag: string;
  heroButtonStyle: string;
  navbarLogoUrl?: string;
  faviconUrl?: string;
  features: HomepageFeature[];
  heroSections: HomepageHeroSection[];
  blocks: HomepageContentBlock[];
}

const DEFAULT_SETTINGS: HomepageSettings = {
  heroTitle: "L’aide à la comptabilité des TPE au meilleur prix.",
  heroSubtitle:
    "Centralisez votre gestion comptable simplement, soyez toujours à jour, et concentrez-vous sur l’essentiel : votre activité.",
  heroButtonLabel: "Découvrir nos logiciels",
  heroButtonLink: "/comparatif-des-offres",
  heroIllustrationUrl:
    "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
  heroTitleTag: "h1",
  heroSubtitleTag: "p",
  heroButtonStyle: "primary",
  navbarLogoUrl: "",
  faviconUrl: "",
  features: [
    {
      title: "Outils simples & complets",
      text: "Des outils intuitifs pour suivre votre comptabilité au quotidien.",
      iconUrl: "",
    },
    {
      title: "Tarifs transparents",
      text: "Des offres claires et sans surprise, adaptées aux TPE.",
      iconUrl: "",
    },
    {
      title: "Support dédié & réactif",
      text: "Une équipe qui répond vite pour vous accompagner.",
      iconUrl: "",
    },
  ],
  heroSections: [],
  blocks: [
    {
      id: "identity",
      kind: "identity",
      title: "Identité visuelle synchronisée",
      subtitle: "Logos, favicon et visuels importés depuis le back-office.",
      body: "Chaque élément graphique est immédiatement reflété côté public pour conserver une cohérence de marque.",
      buttonLabel: "Mettre à jour la charte",
      buttonLink: "/admin/homepage",
      bullets: ["Logo de navigation", "Favicon"],
    },
    {
      id: "experience",
      kind: "experience",
      title: "Expérience immersive",
      subtitle: "Un scroll à la Apple",
      body: "Animations synchronisées, sections qui se dévoilent et transitions douces pour une lecture fluide.",
      bullets: [
        "Intersection Observer pour révéler le contenu au bon moment.",
        "Sections épurées, typographie lisible et responsive.",
      ],
      badge: "Expérience",
    },
    {
      id: "story",
      kind: "story",
      title: "Une histoire en défilement",
      subtitle: "Les points forts de ComptaMatch se découvrent au fil du scroll.",
      body: "Chaque bloc déclenche une évolution visuelle qui reste épinglée pour un effet premium inspiré des pages macOS.",
      badge: "Parcours",
    },
    {
      id: "features",
      kind: "feature-grid",
      title: "Pensé pour les dirigeants exigeants",
      subtitle: "Fonctionnalités clés",
      body: "Grille modulaire, responsive, et synchronisée avec les données du back-office pour mettre en avant vos nouveautés.",
      badge: "Fonctionnalités",
    },
    {
      id: "cta",
      kind: "cta",
      title: "Page d'accueil premium, compatible back-office",
      subtitle:
        "Une expérience inspirée d'Apple, des animations fluides, et des visuels pilotés par vos réglages.",
      body:
        "Vos logos et images sont prêts à être intégrés, sans compromis sur la performance ni l'accessibilité.",
      buttonLabel: "Lancer ComptaMatch",
      buttonLink: "/comparatif-des-offres",
      badge: "Action",
    },
  ],
};

const AdminHomepagePage: React.FC = () => {
  const [settings, setSettings] = React.useState<HomepageSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

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
        setSettings({
          ...DEFAULT_SETTINGS,
          ...(data as HomepageSettings),
          features: Array.isArray((data as HomepageSettings).features)
            ? (data as HomepageSettings).features
            : DEFAULT_SETTINGS.features,
          heroSections: Array.isArray((data as HomepageSettings).heroSections)
            ? (data as HomepageSettings).heroSections
            : [],
          blocks: Array.isArray((data as HomepageSettings).blocks)
            ? (data as HomepageSettings).blocks
            : DEFAULT_SETTINGS.blocks,
        });
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

  const updateFeature = (index: number, patch: Partial<HomepageFeature>) => {
    setSettings((prev) => {
      const next = [...prev.features];
      next[index] = { ...next[index], ...patch };
      return { ...prev, features: next };
    });
  };

  const addFeature = () => {
    setSettings((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { title: "Nouvelle carte", text: "", iconUrl: "" },
      ],
    }));
  };

  const removeFeature = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateHeroSection = (index: number, patch: Partial<HomepageHeroSection>) => {
    setSettings((prev) => {
      const next = [...prev.heroSections];
      next[index] = { ...next[index], ...patch } as HomepageHeroSection;
      return { ...prev, heroSections: next };
    });
  };

  const addHeroSection = () => {
    setSettings((prev) => ({
      ...prev,
      heroSections: [
        ...prev.heroSections,
        {
          title: "Titre du bloc",
          subtitle: "Sous-titre du bloc",
          buttonLabel: prev.heroButtonLabel,
          buttonLink: prev.heroButtonLink,
          illustrationUrl: prev.heroIllustrationUrl,
          align: prev.heroSections.length % 2 === 0 ? "right" : "left",
        },
      ],
    }));
  };

  const removeHeroSection = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      heroSections: prev.heroSections.filter((_, i) => i !== index),
    }));
  };

  const createBlockTemplate = (kind: HomepageContentBlock["kind"] = "experience"): HomepageContentBlock => {
    const id = `block-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    const common = {
      id,
      kind,
      title: "Bloc personnalisé",
      subtitle: "",
      body: "",
      buttonLabel: settings.heroButtonLabel,
      buttonLink: settings.heroButtonLink,
      bullets: [],
      badge: "",
    } satisfies HomepageContentBlock;

    switch (kind) {
      case "identity":
        return {
          ...common,
          title: "Identité visuelle synchronisée",
          subtitle: "Logos, favicon et visuels importés depuis le back-office.",
          body: "Les images importées (logo, favicon) se retrouvent automatiquement sur la page publique.",
          bullets: ["Logo de navigation", "Favicon"],
        };
      case "story":
        return {
          ...common,
          title: "Une histoire en défilement",
          subtitle: "Synchronisé avec les blocs épinglés.",
          body: "Chaque section suit la chronologie et déclenche les visuels collants.",
          badge: "Parcours",
        };
      case "feature-grid":
        return {
          ...common,
          title: "Grille de fonctionnalités",
          subtitle: "Cartes synchronisées",
          body: "Les cartes de mise en avant s'affichent dans ce bloc.",
          badge: "Fonctionnalités",
        };
      case "cta":
        return {
          ...common,
          title: "Appel à l'action",
          subtitle: "Mettre en avant un lien clé",
          body: "Choisissez le libellé et le lien du bouton pour conclure la page.",
          buttonLabel: settings.heroButtonLabel,
          buttonLink: settings.heroButtonLink,
          badge: "Action",
        };
      default:
        return {
          ...common,
          title: "Expérience immersive",
          subtitle: "Bloc narratif",
          body: "Mettez en avant une section immersive avec visuels et puces.",
          bullets: ["Texte à gauche ou à droite", "Animations au scroll"],
          badge: "Expérience",
        };
    }
  };

  const addBlock = () => {
    setSettings((prev) => ({ ...prev, blocks: [...prev.blocks, createBlockTemplate()] }));
  };

  const updateBlock = (id: string, patch: Partial<HomepageContentBlock>) => {
    setSettings((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    }));
  };

  const removeBlock = (id: string) => {
    setSettings((prev) => ({ ...prev, blocks: prev.blocks.filter((block) => block.id !== id) }));
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    setSettings((prev) => {
      const index = prev.blocks.findIndex((block) => block.id === id);
      if (index === -1) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.blocks.length) return prev;
      const reordered = [...prev.blocks];
      const [removed] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, removed);
      return { ...prev, blocks: reordered };
    });
  };

  const updateBlockBullets = (id: string, value: string) => {
    const bullets = value
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
    updateBlock(id, { bullets });
  };

  const changeBlockKind = (id: string, kind: HomepageContentBlock["kind"]) => {
    const template = createBlockTemplate(kind);
    updateBlock(id, { ...template, id, kind });
  };

  const handleAssetUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void,
    key: string
  ) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setUploadError(null);
    setUploadingKey(key);

    try {
      const upload = await uploadAdminImage(selected);
      onUploaded(upload.url);
    } catch (err: any) {
      console.error("Erreur upload asset homepage", err);
      setUploadError(err?.message || "Impossible de téléverser ce fichier pour le moment.");
    } finally {
      setUploadingKey(null);
    }
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
      setSettings({
        ...DEFAULT_SETTINGS,
        ...(data as HomepageSettings),
        features: Array.isArray((data as HomepageSettings).features)
          ? (data as HomepageSettings).features
          : [],
        heroSections: Array.isArray((data as HomepageSettings).heroSections)
          ? (data as HomepageSettings).heroSections
          : [],
        blocks: Array.isArray((data as HomepageSettings).blocks)
          ? (data as HomepageSettings).blocks
          : DEFAULT_SETTINGS.blocks,
      });
      setSuccess("Page d'accueil mise à jour.");
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde de la home", err);
      setError(err?.message || "Impossible d'enregistrer la page d'accueil.");
    } finally {
      setIsSaving(false);
    }
  };

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
      {uploadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {uploadError}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Chargement…
        </div>
      ) : (
        <form onSubmit={save} className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
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
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAssetUpload(e, (url) => updateField("navbarLogoUrl", url), "navbarLogoUrl")}
                    className="text-[11px]"
                  />
                  {uploadingKey === "navbarLogoUrl" && <span>Import en cours...</span>}
                  {settings.navbarLogoUrl && (
                    <img
                      src={settings.navbarLogoUrl}
                      alt="Logo prévisualisation"
                      className="h-8 w-8 rounded object-contain"
                    />
                  )}
                </div>
              </label>
              <label className="text-xs font-medium text-slate-600">
                Favicon (URL)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.faviconUrl || ""}
                  onChange={(e) => updateField("faviconUrl", e.target.value)}
                  placeholder="https://.../favicon.ico"
                />
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAssetUpload(e, (url) => updateField("faviconUrl", url), "faviconUrl")}
                    className="text-[11px]"
                  />
                  {uploadingKey === "faviconUrl" && <span>Import en cours...</span>}
                  {settings.faviconUrl && (
                    <img
                      src={settings.faviconUrl}
                      alt="Favicon prévisualisation"
                      className="h-6 w-6 rounded object-contain"
                    />
                  )}
                </div>
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Le logo de navigation apparaît à gauche du titre dans la barre principale. Le favicon est utilisé pour l’icône
              du site dans l’onglet du navigateur.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
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
                Lien du bouton
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
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, (url) => updateField("heroIllustrationUrl", url), "heroIllustrationUrl")}
                className="text-[11px]"
              />
              {uploadingKey === "heroIllustrationUrl" && <span>Import en cours...</span>}
              {settings.heroIllustrationUrl && (
                <img
                  src={settings.heroIllustrationUrl}
                  alt="Illustration hero"
                  className="h-12 w-12 rounded object-cover"
                />
              )}
            </div>
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

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">Blocs supplémentaires</div>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={addHeroSection}
              >
                + Ajouter un bloc
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Ces blocs reprennent le style du hero avec la possibilité d'inverser la position du texte et de l'image.
            </p>
            <div className="space-y-4">
              {settings.heroSections.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                  Aucun bloc ajouté pour le moment.
                </div>
              )}
              {settings.heroSections.map((section, index) => (
                <div key={index} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">Bloc {index + 1}</div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600"
                      onClick={() => removeHeroSection(index)}
                    >
                      Supprimer
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                      Titre
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.title}
                        onChange={(e) => updateHeroSection(index, { title: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Sous-titre
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.subtitle}
                        onChange={(e) => updateHeroSection(index, { subtitle: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                      Libellé du bouton
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.buttonLabel}
                        onChange={(e) => updateHeroSection(index, { buttonLabel: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Lien du bouton
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.buttonLink}
                        onChange={(e) => updateHeroSection(index, { buttonLink: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                      Illustration
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.illustrationUrl}
                        onChange={(e) => updateHeroSection(index, { illustrationUrl: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Position du texte
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.align || "left"}
                        onChange={(e) => updateHeroSection(index, { align: e.target.value as "left" | "right" })}
                      >
                        <option value="left">Texte à gauche</option>
                        <option value="right">Texte à droite</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleAssetUpload(
                          e,
                          (url) => updateHeroSection(index, { illustrationUrl: url }),
                          `heroSection-${index}`
                        )
                      }
                      className="text-[11px]"
                    />
                    {uploadingKey === `heroSection-${index}` && <span>Import en cours...</span>}
                    {section.illustrationUrl && (
                      <img
                        src={section.illustrationUrl}
                        alt={`Illustration bloc ${index + 1}`}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">Sections de la page d'accueil</div>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={addBlock}
              >
                + Ajouter une section
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Chaque section correspond à un bloc visible sur la page publique (identité, expérience, parcours, fonctionnalités, CTA).
            </p>
            <div className="space-y-4">
              {settings.blocks.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                  Aucun bloc pour le moment. Ajoutez-en pour structurer la page d'accueil.
                </div>
              )}

              {settings.blocks.map((block, index) => (
                <div key={block.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">
                      Bloc {index + 1} — {block.kind}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        onClick={() => moveBlock(block.id, -1)}
                        disabled={index === 0}
                      >
                        ↑ Monter
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        onClick={() => moveBlock(block.id, 1)}
                        disabled={index === settings.blocks.length - 1}
                      >
                        ↓ Descendre
                      </button>
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => removeBlock(block.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-xs font-medium text-slate-600">
                      Type de bloc
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.kind}
                        onChange={(e) => changeBlockKind(block.id, e.target.value as HomepageContentBlock["kind"])}
                      >
                        <option value="identity">Identité visuelle</option>
                        <option value="experience">Bloc immersif</option>
                        <option value="story">Parcours épinglé</option>
                        <option value="feature-grid">Grille de cartes</option>
                        <option value="cta">Appel à l'action</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Badge / étiquette
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.badge || ""}
                        onChange={(e) => updateBlock(block.id, { badge: e.target.value })}
                        placeholder="Fonctionnalités, Expérience..."
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Image illustratrice (optionnel)
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.imageUrl || ""}
                        onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                        placeholder="https://.../visuel.png"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                      Titre du bloc
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Sous-titre
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.subtitle || ""}
                        onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                      />
                    </label>
                  </div>

                  <label className="text-xs font-medium text-slate-600">
                    Texte principal
                    <textarea
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      value={block.body || ""}
                      onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600">
                      Libellé du bouton
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.buttonLabel || ""}
                        onChange={(e) => updateBlock(block.id, { buttonLabel: e.target.value })}
                        placeholder={settings.heroButtonLabel}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Lien du bouton
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.buttonLink || ""}
                        onChange={(e) => updateBlock(block.id, { buttonLink: e.target.value })}
                        placeholder={settings.heroButtonLink}
                      />
                    </label>
                  </div>

                  <label className="text-xs font-medium text-slate-600">
                    Puces (une par ligne)
                    <textarea
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      value={(block.bullets || []).join("\n")}
                      onChange={(e) => updateBlockBullets(block.id, e.target.value)}
                      placeholder={"Ex: Animation au scroll\nLogos synchronisés"}
                    />
                  </label>

                  {block.kind === "identity" && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] text-slate-700">
                      Les visuels importés ci-dessus (logo de navigation, favicon) seront affichés dans ce bloc côté public.
                      Vérifiez-les rapidement :
                      <div className="mt-2 flex items-center gap-3">
                        {settings.navbarLogoUrl && (
                          <img
                            src={settings.navbarLogoUrl}
                            alt="Logo de navigation"
                            className="h-10 w-10 rounded object-contain ring-1 ring-slate-200"
                          />
                        )}
                        {settings.faviconUrl && (
                          <img
                            src={settings.faviconUrl}
                            alt="Favicon"
                            className="h-8 w-8 rounded object-contain ring-1 ring-slate-200"
                          />
                        )}
                        {!settings.navbarLogoUrl && !settings.faviconUrl && (
                          <span className="text-slate-500">Ajoutez un logo et un favicon dans "Identité visuelle".</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">Cartes de mise en avant</div>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={addFeature}
              >
                + Ajouter une carte
              </button>
            </div>
            <p className="text-xs text-slate-500">Ajoutez, supprimez ou importez vos propres icônes d’illustration.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {settings.features.length === 0 && (
                <div className="md:col-span-3 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                  Aucune carte pour le moment. Utilisez le bouton “Ajouter une carte”.
                </div>
              )}
              {settings.features.map((feature, index) => (
                <div key={index} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-900">Carte {index + 1}</div>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-red-600"
                      onClick={() => removeFeature(index)}
                    >
                      Supprimer
                    </button>
                  </div>
                  <label className="text-xs font-medium text-slate-600">
                    Icône (URL)
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={feature.iconUrl || ""}
                      onChange={(e) => updateFeature(index, { iconUrl: e.target.value })}
                    />
                  </label>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleAssetUpload(e, (url) => updateFeature(index, { iconUrl: url }), `feature-${index}`)
                      }
                      className="text-[11px]"
                    />
                    {uploadingKey === `feature-${index}` && <span>Import en cours...</span>}
                    {feature.iconUrl && (
                      <img src={feature.iconUrl} alt="Icône" className="h-8 w-8 rounded object-contain" />
                    )}
                  </div>
                  <label className="text-xs font-medium text-slate-600">
                    Titre
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={feature.title}
                      onChange={(e) => updateFeature(index, { title: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Description
                    <textarea
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      value={feature.text}
                      onChange={(e) => updateFeature(index, { text: e.target.value })}
                    />
                  </label>
                </div>
              ))}
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
