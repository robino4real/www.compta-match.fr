import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface Feature {
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
}

interface HomepageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonUrl: string;
  heroImageUrl?: string | null;
  heroBackgroundImageUrl?: string | null;
  features?: Feature[];
  highlightedProductIds?: string[];
  testimonials?: Testimonial[];
  contentBlockTitle?: string | null;
  contentBlockBody?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

interface DownloadableProductOption {
  id: string;
  name: string;
  shortDescription?: string | null;
  priceCents: number;
}

const EMPTY_SETTINGS: HomepageSettings = {
  heroTitle: "",
  heroSubtitle: "",
  heroButtonLabel: "",
  heroButtonUrl: "",
  heroImageUrl: null,
  heroBackgroundImageUrl: null,
  features: [],
  highlightedProductIds: [],
  testimonials: [],
  contentBlockTitle: "",
  contentBlockBody: "",
  seoTitle: "",
  seoDescription: "",
};

const AdminHomepagePage: React.FC = () => {
  const [settings, setSettings] = React.useState<HomepageSettings | null>(null);
  const [availableProducts, setAvailableProducts] = React.useState<
    DownloadableProductOption[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const parseFeatures = (value: unknown): Feature[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => ({
        title: typeof item?.title === "string" ? item.title : "",
        description:
          typeof item?.description === "string" ? item.description : "",
      }))
      .filter((item) => item.title || item.description);
  };

  const parseTestimonials = (value: unknown): Testimonial[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => ({
        name: typeof item?.name === "string" ? item.name : "",
        role: typeof item?.role === "string" ? item.role : "",
        text: typeof item?.text === "string" ? item.text : "",
      }))
      .filter((item) => item.name || item.role || item.text);
  };

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/admin/homepage-settings`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data?.message || "Impossible de charger la page d'accueil."
          );
        }

        const incomingSettings = (data as { settings?: HomepageSettings })
          .settings;
        const normalized: HomepageSettings = {
          ...EMPTY_SETTINGS,
          ...(incomingSettings || {}),
          features: parseFeatures(incomingSettings?.features),
          testimonials: parseTestimonials(incomingSettings?.testimonials),
          highlightedProductIds: Array.isArray(
            incomingSettings?.highlightedProductIds
          )
            ? (incomingSettings?.highlightedProductIds as unknown[])
                .map((id) => (id == null ? null : String(id)))
                .filter((id): id is string => Boolean(id))
            : [],
        };

        setSettings(normalized);
        const list = Array.isArray((data as any)?.availableProducts)
          ? ((data as any).availableProducts as DownloadableProductOption[])
          : [];
        setAvailableProducts(list);
      } catch (err: any) {
        console.error("Erreur chargement homepage settings", err);
        setError(err?.message || "Erreur lors du chargement.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const updateField = (field: keyof HomepageSettings, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateFeature = (
    index: number,
    field: keyof Feature,
    value: string
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const features = prev.features ? [...prev.features] : [];
      features[index] = { ...features[index], [field]: value } as Feature;
      return { ...prev, features };
    });
  };

  const addFeature = () => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        features: [...(prev.features || []), { title: "", description: "" }],
      };
    });
  };

  const removeFeature = (index: number) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const features = [...(prev.features || [])];
      features.splice(index, 1);
      return { ...prev, features };
    });
  };

  const updateTestimonial = (
    index: number,
    field: keyof Testimonial,
    value: string
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const testimonials = prev.testimonials ? [...prev.testimonials] : [];
      testimonials[index] = {
        ...testimonials[index],
        [field]: value,
      } as Testimonial;
      return { ...prev, testimonials };
    });
  };

  const addTestimonial = () => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        testimonials: [
          ...(prev.testimonials || []),
          { name: "", role: "", text: "" },
        ],
      };
    });
  };

  const removeTestimonial = (index: number) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const testimonials = [...(prev.testimonials || [])];
      testimonials.splice(index, 1);
      return { ...prev, testimonials };
    });
  };

  const handleHighlightedChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const values = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    updateField("highlightedProductIds", values);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const response = await fetch(`${API_BASE_URL}/admin/homepage-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.message || "Impossible d'enregistrer la page d'accueil."
        );
      }
      const updated = (data as { settings?: HomepageSettings }).settings;
      if (updated) {
        setSettings({
          ...EMPTY_SETTINGS,
          ...updated,
          features: parseFeatures(updated.features),
          testimonials: parseTestimonials(updated.testimonials),
          highlightedProductIds: Array.isArray(updated.highlightedProductIds)
            ? (updated.highlightedProductIds as unknown[])
                .map((id) => (id == null ? null : String(id)))
                .filter((id): id is string => Boolean(id))
            : [],
        });
      }
      setSuccess("Page d'accueil enregistrée avec succès.");
    } catch (err: any) {
      console.error("Erreur sauvegarde homepage", err);
      setError(err?.message || "Impossible d'enregistrer.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-slate-600">Chargement de la page...</p>;
  }

  if (!settings) {
    return <p className="text-xs text-red-600">{error || "Aucune donnée."}</p>;
  }

  return (
    <div className="space-y-6">
      <header className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">Page d'accueil</h1>
        <p className="text-xs text-slate-600">
          Personnalisez la page d'accueil publique comme dans un CMS : bannière principale,
          arguments, produits mis en avant, témoignages et SEO.
        </p>
      </header>

      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {success && <p className="text-[11px] text-emerald-600">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">Bannière principale</h2>
              <p className="text-[11px] text-slate-600">
                Titre, sous-titre, bouton et visuels affichés en hero sur la home publique.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Titre</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.heroTitle}
                onChange={(e) => updateField("heroTitle", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Sous-titre</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.heroSubtitle}
                onChange={(e) => updateField("heroSubtitle", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Libellé du bouton</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.heroButtonLabel}
                onChange={(e) => updateField("heroButtonLabel", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">URL du bouton</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.heroButtonUrl}
                onChange={(e) => updateField("heroButtonUrl", e.target.value)}
                placeholder="/offres"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Image (URL)</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.heroImageUrl || ""}
                onChange={(e) => updateField("heroImageUrl", e.target.value)}
                placeholder="https://...jpg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Image de fond (URL)</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.heroBackgroundImageUrl || ""}
                onChange={(e) =>
                  updateField("heroBackgroundImageUrl", e.target.value)
                }
                placeholder="https://...jpg"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">Arguments / bénéfices</h2>
              <p className="text-[11px] text-slate-600">Liste éditable des points forts.</p>
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              Ajouter un argument
            </button>
          </div>

          <div className="space-y-3">
            {(settings.features || []).map((feature, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 p-3 space-y-2"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600">Titre</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={feature.title}
                      onChange={(e) =>
                        updateFeature(index, "title", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600">Description</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={feature.description}
                      onChange={(e) =>
                        updateFeature(index, "description", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-[11px] text-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}

            {(!settings.features || settings.features.length === 0) && (
              <p className="text-[11px] text-slate-500">Aucun argument pour le moment.</p>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">Produits mis en avant</h2>
              <p className="text-[11px] text-slate-600">
                Sélectionnez les produits téléchargeables à afficher sur la home.
              </p>
            </div>
          </div>

          {availableProducts.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Aucun produit actif n'est disponible pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] text-slate-600">Sélection multiple</label>
              <select
                multiple
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.highlightedProductIds || []}
                onChange={handleHighlightedChange}
              >
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} – {(product.priceCents / 100).toFixed(2)} €
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Conseil : choisissez 2 ou 3 logiciels maximum.
              </p>
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">Témoignages</h2>
              <p className="text-[11px] text-slate-600">Ajoutez ou supprimez des témoignages clients.</p>
            </div>
            <button
              type="button"
              onClick={addTestimonial}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              Ajouter un témoignage
            </button>
          </div>

          <div className="space-y-3">
            {(settings.testimonials || []).map((testimonial, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 p-3 space-y-2"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600">Nom</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={testimonial.name}
                      onChange={(e) =>
                        updateTestimonial(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600">Rôle</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={testimonial.role}
                      onChange={(e) =>
                        updateTestimonial(index, "role", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600">Texte</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={testimonial.text}
                      onChange={(e) =>
                        updateTestimonial(index, "text", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTestimonial(index)}
                    className="text-[11px] text-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}

            {(!settings.testimonials || settings.testimonials.length === 0) && (
              <p className="text-[11px] text-slate-500">Aucun témoignage pour le moment.</p>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-black">Bloc texte libre</h2>
            <p className="text-[11px] text-slate-600">Titre et contenu éditorial.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Titre</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.contentBlockTitle || ""}
                onChange={(e) => updateField("contentBlockTitle", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Contenu</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.contentBlockBody || ""}
                onChange={(e) => updateField("contentBlockBody", e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-black">SEO de la page</h2>
            <p className="text-[11px] text-slate-600">Balises title et meta description.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Titre SEO</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.seoTitle || ""}
                onChange={(e) => updateField("seoTitle", e.target.value)}
                placeholder="ComptaMatch | ..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Description SEO</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.seoDescription || ""}
                onChange={(e) => updateField("seoDescription", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminHomepagePage;
