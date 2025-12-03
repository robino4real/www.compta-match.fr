import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import { uploadAdminImage } from "../../lib/adminUpload";
import { HomepageContentBlock, HomepageFeature, HomepageHeroSection } from "../../types/homepage";

const EMPTY_SETTINGS: HomepageSettings = {
  heroTitle: "",
  heroSubtitle: "",
  heroButtonLabel: "",
  heroButtonLink: "",
  heroIllustrationUrl: "",
  heroTitleTag: "h1",
  heroSubtitleTag: "p",
  heroButtonStyle: "primary",
  navbarLogoUrl: "",
  faviconUrl: "",
  features: [],
  heroSections: [],
  blocks: [],
};

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

const blockTemplate = (
  kind: HomepageContentBlock["kind"],
  defaults: Pick<HomepageSettings, "heroButtonLabel" | "heroButtonLink">,
): HomepageContentBlock => ({
  id: `block-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  kind,
  title: "Bloc sans titre",
  subtitle: "",
  body: "",
  buttonLabel: defaults.heroButtonLabel,
  buttonLink: defaults.heroButtonLink,
  bullets: [],
  badge: "",
  imageUrl: "",
  mutedText: "",
  imagePosition: "right",
  revealAnimation: true,
});

const AdminHomepagePage: React.FC = () => {
  const [settings, setSettings] = useState<HomepageSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sectionsCount = useMemo(() => settings.blocks.length + settings.heroSections.length, [settings.blocks.length, settings.heroSections.length]);

  const safeArray = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/admin/homepage`, { credentials: "include" });
        const data = await response.json().catch(() => EMPTY_SETTINGS);
        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger la page d'accueil.");
        }
        setSettings({
          ...EMPTY_SETTINGS,
          ...(data as HomepageSettings),
          features: safeArray((data as HomepageSettings).features),
          heroSections: safeArray((data as HomepageSettings).heroSections),
          blocks: safeArray((data as HomepageSettings).blocks),
        });
      } catch (err: any) {
        console.error("Erreur chargement homepage", err);
        setError(err?.message || "Impossible de charger la page d'accueil.");
        setSettings(EMPTY_SETTINGS);
      } finally {
        setLoading(false);
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
      next[index] = { ...next[index], ...patch } as HomepageFeature;
      return { ...prev, features: next };
    });
  };

  const addFeature = () =>
    setSettings((prev) => ({
      ...prev,
      features: [...prev.features, { title: "Nouvelle carte", text: "", iconUrl: "" }],
    }));

  const removeFeature = (index: number) =>
    setSettings((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));

  const updateHeroSection = (index: number, patch: Partial<HomepageHeroSection>) => {
    setSettings((prev) => {
      const next = [...prev.heroSections];
      next[index] = { ...next[index], ...patch } as HomepageHeroSection;
      return { ...prev, heroSections: next };
    });
  };

  const addHeroSection = () =>
    setSettings((prev) => ({
      ...prev,
      heroSections: [
        ...prev.heroSections,
        {
          title: "Nouveau bloc", // placeholder
          subtitle: "",
          buttonLabel: prev.heroButtonLabel,
          buttonLink: prev.heroButtonLink,
          illustrationUrl: prev.heroIllustrationUrl,
          align: prev.heroSections.length % 2 === 0 ? "left" : "right",
        },
      ],
    }));

  const removeHeroSection = (index: number) =>
    setSettings((prev) => ({ ...prev, heroSections: prev.heroSections.filter((_, i) => i !== index) }));

  const updateBlock = (id: string, patch: Partial<HomepageContentBlock>) => {
    setSettings((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    }));
  };

  const addBlock = (kind: HomepageContentBlock["kind"] = "experience") => {
    setSettings((prev) => ({
      ...prev,
      blocks: [...prev.blocks, blockTemplate(kind, prev)],
    }));
  };

  const removeBlock = (id: string) =>
    setSettings((prev) => ({ ...prev, blocks: prev.blocks.filter((block) => block.id !== id) }));

  const moveBlock = (id: string, direction: -1 | 1) => {
    setSettings((prev) => {
      const index = prev.blocks.findIndex((block) => block.id === id);
      if (index === -1) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.blocks.length) return prev;
      const next = [...prev.blocks];
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      return { ...prev, blocks: next };
    });
  };

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
      const response = await fetch(`${API_BASE_URL}/admin/homepage`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Impossible d'enregistrer la page d'accueil.");
      }
      setSettings({
        ...EMPTY_SETTINGS,
        ...(data as HomepageSettings),
        features: safeArray((data as HomepageSettings).features),
        heroSections: safeArray((data as HomepageSettings).heroSections),
        blocks: safeArray((data as HomepageSettings).blocks),
      });
      setSuccess("Page d'accueil mise à jour en temps réel.");
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
          <p className="text-sm text-slate-600">Reconstruction complète : créez vos sections, cartes et visuels sans blocs préchargés.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{sectionsCount} sections visibles</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">Diffusion temps réel activée</span>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">Chargement…</div>
      ) : (
        <form onSubmit={save} className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Identité visuelle</p>
                <p className="text-xs text-slate-500">Ajoutez vos logos et icônes sans bloc pré-rempli.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs font-medium text-slate-700">
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
                    onChange={(e) => handleUpload(e, (url) => updateField("navbarLogoUrl", url), "navbar")}
                    className="text-[11px]"
                  />
                  {uploadingKey === "navbar" && <span>Import en cours…</span>}
                  {settings.navbarLogoUrl && <img src={settings.navbarLogoUrl} alt="Logo" className="h-8 w-8 rounded object-contain" />}
                </div>
              </label>
              <label className="text-xs font-medium text-slate-700">
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
                    onChange={(e) => handleUpload(e, (url) => updateField("faviconUrl", url), "favicon")}
                    className="text-[11px]"
                  />
                  {uploadingKey === "favicon" && <span>Import en cours…</span>}
                  {settings.faviconUrl && <img src={settings.faviconUrl} alt="Favicon" className="h-6 w-6 rounded object-contain" />}
                </div>
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Hero principal</p>
                <p className="text-xs text-slate-500">Titre, sous-titre, bouton et visuel affichés en haut de la page.</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-700">
                Titre principal
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.heroTitle}
                  onChange={(e) => updateField("heroTitle", e.target.value)}
                  placeholder="Titre de votre page d'accueil"
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Sous-titre
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  value={settings.heroSubtitle}
                  onChange={(e) => updateField("heroSubtitle", e.target.value)}
                  placeholder="Détaillez votre proposition de valeur"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-medium text-slate-700">
                  Libellé du bouton
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={settings.heroButtonLabel}
                    onChange={(e) => updateField("heroButtonLabel", e.target.value)}
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  Lien du bouton
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={settings.heroButtonLink}
                    onChange={(e) => updateField("heroButtonLink", e.target.value)}
                  />
                </label>
              </div>
              <label className="text-xs font-medium text-slate-700">
                Visuel principal (URL)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={settings.heroIllustrationUrl}
                  onChange={(e) => updateField("heroIllustrationUrl", e.target.value)}
                  placeholder="https://.../visuel.png"
                />
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, (url) => updateField("heroIllustrationUrl", url), "hero")}
                    className="text-[11px]"
                  />
                  {uploadingKey === "hero" && <span>Import en cours…</span>}
                  {settings.heroIllustrationUrl && (
                    <img src={settings.heroIllustrationUrl} alt="Aperçu visuel" className="h-12 w-12 rounded object-cover" />
                  )}
                </div>
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Parcours épinglés</p>
                <p className="text-xs text-slate-500">Ces étapes apparaissent dans la timeline publique.</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={addHeroSection}
              >
                + Ajouter une étape
              </button>
            </div>
            {settings.heroSections.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                Aucune étape pour l'instant. Ajoutez-en pour alimenter la timeline.
              </div>
            )}
            <div className="space-y-3">
              {settings.heroSections.map((section, index) => (
                <div key={`${section.title}-${index}`} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Étape {index + 1}</span>
                    <button type="button" className="text-red-600" onClick={() => removeHeroSection(index)}>
                      Supprimer
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-700">
                      Titre
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.title}
                        onChange={(e) => updateHeroSection(index, { title: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Sous-titre
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.subtitle}
                        onChange={(e) => updateHeroSection(index, { subtitle: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-xs font-medium text-slate-700">
                      Libellé du bouton
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.buttonLabel}
                        onChange={(e) => updateHeroSection(index, { buttonLabel: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Lien du bouton
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={section.buttonLink}
                        onChange={(e) => updateHeroSection(index, { buttonLink: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Alignement
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
                  <label className="text-xs font-medium text-slate-700">
                    Illustration (URL)
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={section.illustrationUrl || ""}
                      onChange={(e) => updateHeroSection(index, { illustrationUrl: e.target.value })}
                      placeholder="https://.../illustration.png"
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Cartes mises en avant</p>
                <p className="text-xs text-slate-500">Ces cartes alimentent les grilles "feature-grid".</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={addFeature}
              >
                + Ajouter une carte
              </button>
            </div>
            {settings.features.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                Aucune carte. Ajoutez-en pour remplir vos grilles.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {settings.features.map((feature, index) => (
                <div key={`${feature.title}-${index}`} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Carte {index + 1}</span>
                    <button type="button" className="text-red-600" onClick={() => removeFeature(index)}>
                      Supprimer
                    </button>
                  </div>
                  <label className="text-xs font-medium text-slate-700">
                    Titre
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={feature.title}
                      onChange={(e) => updateFeature(index, { title: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    Description
                    <textarea
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={2}
                      value={feature.text}
                      onChange={(e) => updateFeature(index, { text: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    Icône (URL)
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={feature.iconUrl || ""}
                      onChange={(e) => updateFeature(index, { iconUrl: e.target.value })}
                      placeholder="https://.../icon.png"
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Sections de contenu</p>
                <p className="text-xs text-slate-500">Ajoutez librement des blocs : identité, immersive, story, feature-grid ou CTA.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50"
                  onClick={() => addBlock("experience")}
                >
                  + Bloc immersif
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50"
                  onClick={() => addBlock("feature-grid")}
                >
                  + Grille de cartes
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50"
                  onClick={() => addBlock("cta")}
                >
                  + Appel à l'action
                </button>
              </div>
            </div>

            {settings.blocks.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                Aucun bloc n'est créé. Ajoutez vos sections pour alimenter la page d'accueil.
              </div>
            )}

            <div className="space-y-4">
              {settings.blocks.map((block, index) => (
                <div key={block.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                    <div>Section {index + 1} — {block.kind}</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-3 py-1 hover:bg-white disabled:opacity-50"
                        onClick={() => moveBlock(block.id, -1)}
                        disabled={index === 0}
                      >
                        ↑ Monter
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-3 py-1 hover:bg-white disabled:opacity-50"
                        onClick={() => moveBlock(block.id, 1)}
                        disabled={index === settings.blocks.length - 1}
                      >
                        ↓ Descendre
                      </button>
                      <button type="button" className="text-red-600" onClick={() => removeBlock(block.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-xs font-medium text-slate-700">
                      Type de bloc
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.kind}
                        onChange={(e) => updateBlock(block.id, { kind: e.target.value as HomepageContentBlock["kind"] })}
                      >
                        <option value="identity">Identité visuelle</option>
                        <option value="experience">Bloc immersif</option>
                        <option value="story">Story</option>
                        <option value="feature-grid">Grille de cartes</option>
                        <option value="cta">Appel à l'action</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Badge / étiquette
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.badge || ""}
                        onChange={(e) => updateBlock(block.id, { badge: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Image illustratrice (URL)
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.imageUrl || ""}
                        onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                        placeholder="https://.../visuel.png"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, (url) => updateBlock(block.id, { imageUrl: url }), `block-${block.id}`)}
                      className="text-[11px]"
                    />
                    {uploadingKey === `block-${block.id}` && <span>Import en cours…</span>}
                    {block.imageUrl && (
                      <img src={block.imageUrl} alt="Visuel" className="h-10 w-10 rounded object-contain ring-1 ring-slate-200" />
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-700">
                      Titre
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Sous-titre
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.subtitle || ""}
                        onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="text-xs font-medium text-slate-700">
                    Corps de texte
                    <textarea
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      value={block.body || ""}
                      onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-slate-700">
                      Libellé du bouton
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.buttonLabel || ""}
                        onChange={(e) => updateBlock(block.id, { buttonLabel: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Lien du bouton
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.buttonLink || ""}
                        onChange={(e) => updateBlock(block.id, { buttonLink: e.target.value })}
                      />
                    </label>
                  </div>

                  <label className="text-xs font-medium text-slate-700">
                    Puces (une par ligne)
                    <textarea
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      value={(block.bullets || []).join("\n")}
                      onChange={(e) => updateBlock(block.id, { bullets: e.target.value.split(/\n+/).map((line) => line.trim()).filter(Boolean) })}
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-xs font-medium text-slate-700">
                      Position de l'image
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.imagePosition || "right"}
                        onChange={(e) => updateBlock(block.id, { imagePosition: e.target.value as "left" | "right" })}
                      >
                        <option value="left">Image à gauche</option>
                        <option value="right">Image à droite</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Animation au scroll
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.revealAnimation ? "1" : "0"}
                        onChange={(e) => updateBlock(block.id, { revealAnimation: e.target.value === "1" })}
                      >
                        <option value="1">Activée</option>
                        <option value="0">Désactivée</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Texte discret
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={block.mutedText || ""}
                        onChange={(e) => updateBlock(block.id, { mutedText: e.target.value })}
                        placeholder="Texte d'aide ou mention"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
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
              {saving ? "Enregistrement…" : "Enregistrer et publier"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminHomepagePage;
