import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { uploadAdminImage } from "../../lib/adminUpload";
import { resolveAssetUrl } from "../../lib/resolveAssetUrl";

type StatusFilter = "active" | "archived" | "all";

interface DownloadableProduct {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  fileName: string;
  fileSize: number;
  isActive: boolean;
  isArchived?: boolean;
  createdAt: string;
  shortDescription?: string | null;
  featureBullets?: string[] | null;
  thumbnailUrl?: string | null;
  category?: DownloadableCategory | null;
}

interface DownloadableCategory {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const AdminDownloadsPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [priceEuros, setPriceEuros] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [longDescription, setLongDescription] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [isUploadingThumbnail, setIsUploadingThumbnail] = React.useState(false);
  const [thumbnailUploadError, setThumbnailUploadError] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<DownloadableCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false);
  const [categoriesError, setCategoriesError] = React.useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = React.useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategorySlug, setNewCategorySlug] = React.useState("");
  const [isSavingCategory, setIsSavingCategory] = React.useState(false);
  const [featureBullets, setFeatureBullets] = React.useState<string[]>([]);
  const [featureInput, setFeatureInput] = React.useState("");
  const [detailHtml, setDetailHtml] = React.useState("");
  const [releaseChannel, setReleaseChannel] = React.useState("stable");
  const [binaryPlatform, setBinaryPlatform] = React.useState("WINDOWS");
  const [platforms, setPlatforms] = React.useState<string[]>([]);
  const [licenseType, setLicenseType] = React.useState("perpetual");
  const [supportContact, setSupportContact] = React.useState("support@compta-match.fr");
  const [file, setFile] = React.useState<File | null>(null);

  const [seoTitleOverride, setSeoTitleOverride] = React.useState("");
  const [seoDescriptionOverride, setSeoDescriptionOverride] = React.useState("");

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");
  const [searchTerm, setSearchTerm] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [products, setProducts] = React.useState<DownloadableProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState<boolean>(false);
  const [errorProducts, setErrorProducts] = React.useState<string | null>(null);

  const fetchProducts = React.useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setErrorProducts(null);

      const response = await fetch(
        `${API_BASE_URL}/admin/downloadable-products?status=${statusFilter}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de récupérer la liste des produits."
        );
      }

      const list = Array.isArray((data as { products?: unknown }).products)
        ? ((data as { products?: DownloadableProduct[] }).products as DownloadableProduct[])
        : [];
      setProducts(list);
    } catch (err: any) {
      console.error("Erreur lors du chargement des produits téléchargeables :", err);
      setErrorProducts(
        err?.message ||
          "Une erreur est survenue lors du chargement des produits téléchargeables."
      );
    } finally {
      setIsLoadingProducts(false);
    }
  }, [statusFilter]);

  const fetchCategories = React.useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      setCategoriesError(null);

      const response = await fetch(`${API_BASE_URL}/admin/downloadable-categories`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de récupérer les catégories."
        );
      }

      const list = Array.isArray((data as { categories?: unknown }).categories)
        ? ((data as { categories?: DownloadableCategory[] }).categories as DownloadableCategory[])
        : [];
      setCategories(list);
    } catch (err: any) {
      console.error("Erreur lors du chargement des catégories :", err);
      setCategoriesError(
        err?.message ||
          "Une erreur est survenue lors du chargement des catégories."
      );
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  React.useEffect(() => {
    if (!slugEdited && name.trim()) {
      setSlug(slugify(name));
    }
  }, [name, slugEdited]);

  React.useEffect(() => {
    if (newCategoryName.trim() && !newCategorySlug.trim()) {
      setNewCategorySlug(slugify(newCategoryName));
    }
  }, [newCategoryName, newCategorySlug]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  React.useEffect(() => {
    if (
      selectedCategoryId &&
      !categories.some((category) => category.id === selectedCategoryId)
    ) {
      setSelectedCategoryId("");
    }
  }, [categories, selectedCategoryId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setThumbnailUploadError(null);
    setIsUploadingThumbnail(true);

    try {
      const upload = await uploadAdminImage(selected);
      setThumbnailUrl(upload.url);
    } catch (err: any) {
      console.error("Erreur upload vignette", err);
      setThumbnailUploadError(
        err?.message || "Impossible de téléverser la vignette pour le moment."
      );
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFeatureBullets((prev) => [...prev, featureInput.trim()]);
    setFeatureInput("");
  };

  const removeFeature = (index: number) => {
    setFeatureBullets((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((entry) => entry !== platform)
        : [...prev, platform]
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoriesError("Le nom de la catégorie est requis.");
      return;
    }

    setIsSavingCategory(true);
    setCategoriesError(null);
    setCategorySuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/downloadable-categories`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug: newCategorySlug.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de créer cette catégorie."
        );
      }

      const created = (data as { category?: DownloadableCategory }).category;

      if (created) {
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setSelectedCategoryId((current) => current || created.id);
      }

      setNewCategoryName("");
      setNewCategorySlug("");
      setCategorySuccess("Catégorie ajoutée.");
    } catch (err: any) {
      console.error("Erreur lors de la création de catégorie :", err);
      setCategoriesError(
        err?.message ||
          "Une erreur est survenue lors de la création de la catégorie."
      );
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setCategoriesError(null);
    setCategorySuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/downloadable-categories/${categoryId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de supprimer cette catégorie."
        );
      }

      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId("");
      }
      setCategorySuccess("Catégorie supprimée.");
    } catch (err: any) {
      console.error("Erreur lors de la suppression de catégorie", err);
      setCategoriesError(
        err?.message ||
          "Impossible de supprimer cette catégorie pour le moment."
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Le nom du logiciel est requis.");
      return;
    }

    if (!priceEuros.trim()) {
      setError("Le prix est requis.");
      return;
    }

    if (!file) {
      setError("Veuillez sélectionner un fichier à téléverser.");
      return;
    }

    const normalizedPrice = priceEuros.replace(",", ".");
    const priceNumber = Number(normalizedPrice);

    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setError("Le prix doit être un nombre positif.");
      return;
    }

    const priceCents = Math.round(priceNumber * 100);

    const detailSegments: string[] = [];
    if (detailHtml.trim()) {
      detailSegments.push(detailHtml.trim());
    }
    const metaList: string[] = [];
    if (releaseChannel) metaList.push(`Canal : ${releaseChannel}`);
    if (licenseType) metaList.push(`Licence : ${licenseType}`);
    if (platforms.length) metaList.push(`Compatibilité : ${platforms.join(", ")}`);
    if (supportContact.trim()) metaList.push(`Support : ${supportContact}`);
    if (metaList.length) {
      detailSegments.push(`<ul>${metaList.map((line) => `<li>${line}</li>`).join("")}</ul>`);
    }
    const formattedDetailHtml = detailSegments.join("\n");

    const formData = new FormData();
    formData.append("name", name.trim());
    if (slug.trim()) {
      formData.append("slug", slug.trim());
    }
    if (selectedCategoryId) {
      formData.append("categoryId", selectedCategoryId);
    }
    formData.append("priceCents", String(priceCents));
    if (shortDescription.trim()) {
      formData.append("shortDescription", shortDescription.trim());
    }
    if (longDescription.trim()) {
      formData.append("longDescription", longDescription.trim());
    }
    if (thumbnailUrl.trim()) {
      formData.append("thumbnailUrl", thumbnailUrl.trim());
    }
    formData.append("platform", binaryPlatform);
    if (featureBullets.length) {
      formData.append("featureBullets", JSON.stringify(featureBullets));
    }
    if (formattedDetailHtml.trim()) {
      formData.append("detailHtml", formattedDetailHtml);
    }
    formData.append("file", file);

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/admin/downloads`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccess("Produit créé et fichier téléversé avec succès.");
        setName("");
        setSlug("");
        setSlugEdited(false);
        setPriceEuros("");
        setShortDescription("");
        setLongDescription("");
        setThumbnailUrl("");
        setFeatureBullets([]);
        setFeatureInput("");
        setDetailHtml("");
        setReleaseChannel("stable");
        setBinaryPlatform("WINDOWS");
        setPlatforms([]);
        setLicenseType("perpetual");
        setSupportContact("support@compta-match.fr");
        setSelectedCategoryId("");
        setFile(null);
        event.currentTarget.reset();
        await fetchProducts();
      } else {
        setError(
          (data as { message?: string }).message ||
            "Impossible de créer ce produit téléchargeable."
        );
      }
    } catch (err) {
      console.error("Erreur lors de la création du produit téléchargeable", err);
      setError(
        "Une erreur est survenue lors de la création du produit. Merci de réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = React.useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        (product.slug && product.slug.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const pricePreview = React.useMemo(() => {
    const normalizedPrice = priceEuros.replace(",", ".");
    const priceNumber = Number(normalizedPrice);
    if (Number.isNaN(priceNumber)) return null;
    return {
      euros: priceNumber.toFixed(2),
      cents: Math.round(priceNumber * 100),
    };
  }, [priceEuros]);

  const seoTitle = (seoTitleOverride || name || "Titre SEO à définir").trim();
  const seoDescription = (
    seoDescriptionOverride ||
    shortDescription ||
    longDescription ||
    "Décrivez le bénéfice principal et le format téléchargeable."
  ).trim();
  const seoTitleLength = seoTitle.length;
  const seoDescriptionLength = seoDescription.length;
  const seoScore = React.useMemo(() => {
    let score = 0;
    if (seoTitleLength >= 40 && seoTitleLength <= 60) score += 40;
    if (seoDescriptionLength >= 110 && seoDescriptionLength <= 170) score += 40;
    if (thumbnailUrl) score += 10;
    if (slug) score += 10;
    return score;
  }, [seoDescriptionLength, seoTitleLength, slug, thumbnailUrl]);
  const seoChecklist = [
    { label: "Slug propre", done: Boolean(slug) },
    { label: "Titre entre 40 et 60 caractères", done: seoTitleLength >= 40 && seoTitleLength <= 60 },
    { label: "Description entre 110 et 170 caractères", done: seoDescriptionLength >= 110 && seoDescriptionLength <= 170 },
    { label: "Visuel OG (vignette)", done: Boolean(thumbnailUrl) },
  ];

  const copySlugToClipboard = async () => {
    try {
      if (!slug) return;
      await navigator.clipboard.writeText(slug);
    } catch (err) {
      console.error("Copie slug", err);
    }
  };

  const checklist = [
    { label: "Identité complète", done: Boolean(name && shortDescription && slug) },
    { label: "Tarif validé", done: Boolean(pricePreview && pricePreview.cents > 0) },
    { label: "Fichier attaché", done: Boolean(file) },
    { label: "Mise en avant (vignette ou bullets)", done: Boolean(thumbnailUrl || featureBullets.length) },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Back-office</p>
            <h1 className="text-2xl font-semibold">Articles téléchargeables</h1>
            <p className="text-sm text-slate-200/80">
              Concevez un produit prêt à la vente : identité, pitch, packaging et contrôle qualité
              réunis dans un seul onglet.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-slate-200">Assistant live</p>
            <p className="font-semibold">{name || "Nouveau logiciel"}</p>
            <p className="text-xs text-slate-200">{slug || "slug-auto"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black">Créer un nouveau produit</h2>
              <p className="text-xs text-slate-600">
                Renseignez chaque zone : nous gardons la validation et la mise en forme cohérente.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Création en cours..." : "Publier"}
            </button>
          </div>

          {error && <p className="text-[11px] text-red-600">{error}</p>}
          {success && <p className="text-[11px] text-emerald-600">{success}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-700">Identité & pitch</p>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="ComptaMini - Edition comptabilité générale"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugEdited(true);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="comptamini-compta-generale"
                />
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <p>Généré automatiquement. Vous pouvez le personnaliser si besoin.</p>
                  <button
                    type="button"
                    onClick={copySlugToClipboard}
                    className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:border-black hover:text-black"
                  >
                    Copier
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Catégorie</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Aucune catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {isLoadingCategories && (
                  <p className="text-[11px] text-slate-500">Chargement des catégories...</p>
                )}
                {categoriesError && (
                  <p className="text-[11px] text-red-600">{categoriesError}</p>
                )}
                <p className="text-[11px] text-slate-500">
                  Sélectionnez une catégorie pour organiser la vitrine Logiciels.
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Vignette / visuel</label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="https://cdn.exemple.com/visuels/comptamini.png"
                />
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="text-[11px]"
                  />
                  {isUploadingThumbnail && <span>Import en cours...</span>}
                </div>
                {thumbnailUploadError && (
                  <p className="text-[11px] text-red-600">{thumbnailUploadError}</p>
                )}
                {thumbnailUrl && (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
                    <img
                      src={resolveAssetUrl(thumbnailUrl)}
                      alt="Prévisualisation de la vignette"
                      className="h-10 w-10 rounded object-cover"
                    />
                    <button
                      type="button"
                      className="text-slate-500 hover:text-black"
                      onClick={() => setThumbnailUrl("")}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-slate-500">
                  URL d&apos;aperçu affichée dans la vitrine et dans la fiche produit. Vous pouvez saisir une URL ou importer un visuel depuis votre ordinateur.
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Courte description</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Résumé rapide affiché dans la vitrine."
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Titre SEO dédié</label>
                <input
                  type="text"
                  value={seoTitleOverride}
                  onChange={(e) => setSeoTitleOverride(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Optimisez le titre pour Google (40-60 caractères)"
                />
                <p className="text-[11px] text-slate-500">{seoTitleLength} caractères (40-60 recommandé).</p>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Description SEO dédiée</label>
                <textarea
                  value={seoDescriptionOverride}
                  onChange={(e) => setSeoDescriptionOverride(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black min-h-[80px]"
                  placeholder="Résumé cliquable pour les SERP (110-170 caractères)."
                />
                <p className="text-[11px] text-slate-500">{seoDescriptionLength} caractères.</p>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Description détaillée</label>
                <textarea
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black min-h-[110px]"
                  placeholder="Fonctionnalités clés, cas d'usage, prérequis..."
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-700">Tarification & packaging</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-800">Prix TTC (euros) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={priceEuros}
                    onChange={(e) => setPriceEuros(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="49,90"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Le montant est converti en centimes côté serveur.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-800">Type de licence</label>
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="perpetual">Licence perpétuelle</option>
                    <option value="subscription">Abonnement</option>
                    <option value="seat">Par utilisateur</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Information ajoutée automatiquement dans les notes détaillées.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-800">Canal de release</label>
                  <select
                    value={releaseChannel}
                    onChange={(e) => setReleaseChannel(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="stable">Stable</option>
                    <option value="beta">Beta</option>
                    <option value="lts">LTS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-800">Contact support</label>
                  <input
                    type="text"
                    value={supportContact}
                    onChange={(e) => setSupportContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="support@compta-match.fr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-medium text-slate-800">Plateformes ciblées</p>
                <div className="flex flex-wrap gap-2">
                  {["Windows", "macOS", "Linux", "Web"].map((platform) => {
                    const active = platforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-black hover:text-black"
                        }`}
                      >
                        {active ? "✓ " : ""}
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-black">Promesse et arguments</p>
                <span className="text-[11px] text-slate-500">Ajoutez des bullet points cliquables</span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Ex : Plan de comptes personnalisable"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="rounded-full border border-black px-4 py-2 text-xs font-semibold text-black transition hover:bg-black hover:text-white"
                >
                  Ajouter
                </button>
              </div>
              {featureBullets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {featureBullets.map((feature, index) => (
                    <span
                      key={feature + index}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-800"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-slate-500 hover:text-black"
                        aria-label={`Supprimer ${feature}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">Notes détaillées (HTML autorisé)</label>
                <textarea
                  value={detailHtml}
                  onChange={(e) => setDetailHtml(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black min-h-[120px]"
                  placeholder="<ul><li>Intégration API simplifiée</li><li>Modèles d'export personnalisables</li></ul>"
                />
                <p className="text-[11px] text-slate-500">
                  Un bloc mémo contenant licence, plateforme, canal et contact sera ajouté sous forme de liste.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white p-4">
              <p className="text-sm font-semibold text-black">Fichier à téléverser</p>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-800">
                  Plateforme du binaire
                </label>
                <select
                  value={binaryPlatform}
                  onChange={(e) => setBinaryPlatform(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="WINDOWS">Windows</option>
                  <option value="MACOS">MacOS</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Sélectionnez l’OS correspondant au fichier importé.
                </p>
              </div>
              <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white hover:file:text-black hover:file:border hover:file:border-black"
                required
              />
              <p className="text-[11px] text-slate-500">
                Archive, binaire ou image disque. Nous conservons la taille et le type MIME.
              </p>
              <div className="rounded-lg bg-white p-3 text-[11px] text-slate-700 shadow-inner">
                <p className="font-semibold text-slate-800">Résumé import</p>
                <ul className="mt-2 space-y-1">
                  <li>Nom : {file?.name || "—"}</li>
                  <li>Taille : {file ? formatFileSize(file.size) : "—"}</li>
                  <li>Canal : {releaseChannel}</li>
                  <li>Licence : {licenseType}</li>
                  <li>Compatibilité : {platforms.length ? platforms.join(", ") : "Non renseigné"}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-black">Contrôles rapides</p>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-xs text-slate-700">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                        item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.done ? "✓" : "•"}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
              {pricePreview && (
                <div className="rounded-lg bg-white p-3 text-[11px] text-slate-700">
                  <p className="font-semibold text-slate-900">Lecture tarif</p>
                  <p>{pricePreview.euros} € TTC ({pricePreview.cents} centimes)</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-black">Aperçu vitrine & SEO express</p>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="h-28 w-full rounded-lg bg-slate-100 md:w-40">
                  {thumbnailUrl ? (
                    <img
                      src={resolveAssetUrl(thumbnailUrl)}
                      alt="Aperçu visuel"
                      className="h-full w-full rounded-lg object-cover"
                    />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] text-slate-400">
                        Aucun visuel
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 text-sm text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
                        Nouveau
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {licenseType}
                      </span>
                      {releaseChannel !== "stable" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          {releaseChannel}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-black">{name || "Produit sans nom"}</p>
                    <p className="text-xs text-slate-600">{shortDescription || "Ajoutez un pitch court."}</p>
                    {featureBullets.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {featureBullets.slice(0, 3).map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700"
                          >
                            {feature}
                          </span>
                        ))}
                        {featureBullets.length > 3 && (
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">
                            +{featureBullets.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[13px] font-semibold text-emerald-700">
                      {pricePreview ? `${pricePreview.euros} € TTC` : "Prix à définir"}
                    </p>
                    <p className="text-[11px] text-slate-500">Support : {supportContact || "À renseigner"}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Snippet SERP</p>
                    <span className="text-[11px] font-semibold text-slate-600">Score : {seoScore}/100</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-inner">
                    <p className="truncate text-sm font-semibold text-indigo-900">{seoTitle}</p>
                    <p className="truncate text-xs text-emerald-700">https://www.compta-match.fr/telechargements/{slug || "slug"}</p>
                    <p className="line-clamp-2 pt-1 text-xs text-slate-700">{seoDescription}</p>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-700">
                    {seoChecklist.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span>{item.label}</span>
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                            item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.done ? "✓" : "!"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-black">Centre de pilotage</h3>
              <p className="text-xs text-slate-600">Filtrez vos ressources et accédez à l&apos;édition avancée.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="active">Actifs</option>
                <option value="archived">Archivés</option>
                <option value="all">Tous</option>
              </select>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Recherche par nom ou slug"
              />
            </div>
          </div>

          {isLoadingProducts && (
            <p className="text-[11px] text-slate-500">Chargement en cours...</p>
          )}

          {errorProducts && (
            <p className="text-[11px] text-red-600">{errorProducts}</p>
          )}

          {!isLoadingProducts && !errorProducts && filteredProducts.length === 0 && (
            <p className="text-[11px] text-slate-500">Aucun produit à afficher avec ce filtre.</p>
          )}

          {!isLoadingProducts && !errorProducts && filteredProducts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Produit</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Slug</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Catégorie</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Tarif</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Argumentaire</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Fichier</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Statut</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Créé le</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const priceEuros = (product.priceCents ?? 0) / 100;
                    const created = product.createdAt
                      ? new Date(product.createdAt).toISOString().slice(0, 10)
                      : "—";

                    return (
                      <tr key={product.id} className="odd:bg-white even:bg-white">
                        <td className="px-3 py-3 align-top text-slate-800">
                          <div className="flex items-start gap-2">
                            <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                              {product.thumbnailUrl ? (
                                <img
                                  src={resolveAssetUrl(product.thumbnailUrl)}
                                  alt="vignette"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                                  —
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-[11px] text-slate-500">
                                {product.shortDescription || "Sans description"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-slate-700">{product.slug}</td>
                        <td className="px-3 py-3 align-top text-slate-700">
                          {product.category?.name || "—"}
                        </td>
                        <td className="px-3 py-3 align-top text-slate-700">{priceEuros.toFixed(2)} €</td>
                        <td className="px-3 py-3 align-top text-slate-700">
                          {product.featureBullets && product.featureBullets.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.featureBullets.slice(0, 3).map((feature) => (
                                <span
                                  key={feature}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                                >
                                  {feature}
                                </span>
                              ))}
                              {product.featureBullets.length > 3 && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                  +{product.featureBullets.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-slate-700">
                          <div className="space-y-1">
                            <p>{product.fileName}</p>
                            <p className="text-[11px] text-slate-500">{formatFileSize(product.fileSize)}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-slate-700">
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                              product.isArchived
                                ? "bg-slate-200 text-slate-700"
                                : product.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {product.isArchived ? "Archivé" : product.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top text-slate-700">{created}</td>
                        <td className="px-3 py-3 align-top text-slate-700">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/telechargements/${product.id}`)}
                              className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-black hover:text-black"
                            >
                              Modifier
                            </button>
                            <a
                              href={`${API_BASE_URL}/downloads/${product.slug}`}
                              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-black hover:text-black"
                            >
                              Voir la fiche
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-start-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-black">Catégories des téléchargements</h3>
              <p className="text-xs text-slate-600">
                Créez, supprimez et rafraîchissez les catégories utilisées sur la page Logiciels.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchCategories}
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-black hover:text-black"
            >
              Rafraîchir
            </button>
          </div>

          {categoriesError && (
            <p className="text-[11px] text-red-600">{categoriesError}</p>
          )}
          {categorySuccess && (
            <p className="text-[11px] text-emerald-700">{categorySuccess}</p>
          )}

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              Nouvelle catégorie
            </p>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ex : Comptabilité en ligne"
            />
            <input
              type="text"
              value={newCategorySlug}
              onChange={(e) => setNewCategorySlug(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Slug personnalisé (optionnel)"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={isSavingCategory}
              className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingCategory ? "Enregistrement..." : "Créer la catégorie"}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              Liste des catégories
            </p>
            {isLoadingCategories ? (
              <p className="text-[11px] text-slate-500">Chargement en cours...</p>
            ) : categories.length === 0 ? (
              <p className="text-[11px] text-slate-500">Aucune catégorie définie pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {categories.map((category) => {
                  const isProtected = Boolean(category.productCount && category.productCount > 0);
                  return (
                    <li key={category.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                        <p className="text-[11px] text-slate-500">{category.slug} • {category.productCount ?? 0} produit(s)</p>
                      </div>
                      <button
                        type="button"
                        disabled={isProtected}
                        onClick={() => handleDeleteCategory(category.id)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Supprimer ${category.name}`}
                      >
                        {isProtected ? "Utilisée" : "Supprimer"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDownloadsPage;
