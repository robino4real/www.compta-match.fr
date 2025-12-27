import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { uploadAdminImage } from "../../lib/adminUpload";
import { resolveAssetUrl } from "../../lib/resolveAssetUrl";
import SeoOverrideEditor from "../../components/admin/SeoOverrideEditor";

interface AdminDownloadProduct {
  id: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  cardImageUrl?: string | null;
  priceCents: number;
  currency: string;
  isActive: boolean;
  detailSlides?: { imageUrl?: string | null; description?: string | null }[];
  category?: DownloadableCategory | null;
  categoryId?: string | null;
  binaries?: { id: string; platform: "WINDOWS" | "MACOS"; fileName: string; fileSize: number }[];
}

interface DownloadableCategory {
  id: string;
  name: string;
  slug: string;
}

interface DetailSlideFormValue {
  imageUrl: string;
  description: string;
}

const AdminDownloadEditPage: React.FC = () => {
  const [product, setProduct] = React.useState<AdminDownloadProduct | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [longDescription, setLongDescription] = React.useState("");
  const [cardImageUrl, setCardImageUrl] = React.useState("");
  const [cardImageError, setCardImageError] = React.useState<string | null>(
    null
  );
  const [isUploadingCardImage, setIsUploadingCardImage] = React.useState(false);
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [thumbnailError, setThumbnailError] = React.useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = React.useState(false);
  const [categories, setCategories] = React.useState<DownloadableCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [categoriesError, setCategoriesError] = React.useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false);
  const [detailSlides, setDetailSlides] = React.useState<DetailSlideFormValue[]>(
    []
  );
  const [slideUploadError, setSlideUploadError] = React.useState<string | null>(
    null
  );
  const [uploadingSlideIndex, setUploadingSlideIndex] =
    React.useState<number | null>(null);
  const [priceEuros, setPriceEuros] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [binaryPlatform, setBinaryPlatform] = React.useState("WINDOWS");
  const [binaryUploadError, setBinaryUploadError] = React.useState<string | null>(
    null
  );
  const [isUploadingBinary, setIsUploadingBinary] = React.useState(false);
  const [binaries, setBinaries] = React.useState<
    NonNullable<AdminDownloadProduct["binaries"]>
  >([]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const loadCategories = React.useCallback(async () => {
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
      console.error("Erreur lors du chargement des catégories", err);
      setCategoriesError(
        err?.message || "Impossible de charger les catégories pour le moment."
      );
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  React.useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/admin/downloads/${id}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de récupérer le produit téléchargeable."
          );
        }

        const prod: AdminDownloadProduct = data.product;
        setProduct(prod);

        setName(prod.name ?? "");
        setShortDescription(prod.shortDescription ?? "");
        setLongDescription(prod.longDescription ?? "");
        setCardImageUrl(prod.cardImageUrl ?? "");
        setThumbnailUrl(prod.thumbnailUrl ?? "");
        setSelectedCategoryId(prod.category?.id || prod.categoryId || "");
        setDetailSlides(
          Array.isArray(prod.detailSlides)
            ? prod.detailSlides.map((slide) => ({
                imageUrl: slide?.imageUrl ?? "",
                description: slide?.description ?? "",
              }))
            : []
        );
        setPriceEuros(
          typeof prod.priceCents === "number"
            ? (prod.priceCents / 100).toString()
            : ""
        );
        setIsActive(Boolean(prod.isActive));
        setBinaries(Array.isArray(prod.binaries) ? prod.binaries : []);
        if (prod.binaries?.length) {
          setBinaryPlatform(prod.binaries[0].platform);
        }
      } catch (err: any) {
        console.error("Erreur GET /admin/downloads/:id :", err);
        setError(
          err?.message ||
            "Une erreur est survenue lors du chargement du produit."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    loadCategories();
  }, [id, loadCategories]);

  React.useEffect(() => {
    if (
      selectedCategoryId &&
      !categories.some((category) => category.id === selectedCategoryId)
    ) {
      setSelectedCategoryId("");
    }
  }, [categories, selectedCategoryId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const parsedPrice = Number(priceEuros.replace(",", "."));
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        throw new Error("Le prix doit être un nombre positif (en euros).");
      }

      const payload = {
        name: name.trim(),
        shortDescription: shortDescription.trim() || null,
        longDescription: longDescription.trim() || null,
        cardImageUrl: cardImageUrl.trim() || null,
        thumbnailUrl: thumbnailUrl.trim() || null,
        detailSlides: detailSlides
          .map((slide) => ({
            imageUrl: slide.imageUrl.trim() || null,
            description: slide.description.trim() || null,
          }))
          .filter((slide) => slide.imageUrl),
        priceCents: Math.round(parsedPrice * 100),
        isActive,
        categoryId: selectedCategoryId || null,
      };

      const response = await fetch(`${API_BASE_URL}/admin/downloads/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de mettre à jour le produit téléchargeable."
        );
      }

      setSaveSuccess("Produit mis à jour avec succès.");
      if (data.product) {
        setProduct(data.product);
      }
    } catch (err: any) {
      console.error("Erreur PUT /admin/downloads/:id :", err);
      setSaveError(
        err?.message ||
          "Une erreur est survenue lors de la mise à jour du produit."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setThumbnailError(null);
    setIsUploadingThumbnail(true);

    try {
      const upload = await uploadAdminImage(selected);
      setThumbnailUrl(upload.url);
    } catch (err: any) {
      console.error("Erreur upload vignette", err);
      setThumbnailError(
        err?.message || "Impossible de téléverser la vignette pour le moment."
      );
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleCardImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setCardImageError(null);
    setIsUploadingCardImage(true);

    try {
      const upload = await uploadAdminImage(selected);
      setCardImageUrl(upload.url);
    } catch (err: any) {
      console.error("Erreur upload image de vignette", err);
      setCardImageError(
        err?.message || "Impossible de téléverser l'image de vignette pour le moment."
      );
    } finally {
      setIsUploadingCardImage(false);
    }
  };

  const handleAddSlide = () => {
    setDetailSlides((prev) => [...prev, { imageUrl: "", description: "" }]);
  };

  const handleRemoveSlide = (index: number) => {
    setDetailSlides((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSlideChange = (
    index: number,
    field: keyof DetailSlideFormValue,
    value: string
  ) => {
    setDetailSlides((prev) =>
      prev.map((slide, idx) =>
        idx === index
          ? {
              ...slide,
              [field]: value,
            }
          : slide
      )
    );
  };

  const handleSlideImageUpload = async (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setSlideUploadError(null);
    setUploadingSlideIndex(index);

    try {
      const upload = await uploadAdminImage(selected);
      setDetailSlides((prev) =>
        prev.map((slide, idx) =>
          idx === index ? { ...slide, imageUrl: upload.url } : slide
        )
      );
    } catch (err: any) {
      console.error("Erreur upload visuel de descriptif", err);
      setSlideUploadError(
        err?.message || "Impossible de téléverser ce visuel pour le moment."
      );
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const platformLabel = (platform: string) =>
    platform === "MACOS" ? "MacOS" : "Windows";

  const handleBinaryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files?.[0];
    if (!selected || !id) return;

    setBinaryUploadError(null);
    setIsUploadingBinary(true);

    try {
      const formData = new FormData();
      formData.append("file", selected);
      formData.append("platform", binaryPlatform);

      const response = await fetch(`${API_BASE_URL}/admin/downloads/${id}/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de téléverser ce fichier."
        );
      }

      if ((data as { binary?: AdminDownloadProduct["binaries"][number] }).binary) {
        const binary = (data as { binary: AdminDownloadProduct["binaries"][number] }).binary;
        setBinaries((prev) => {
          const filtered = prev.filter((entry) => entry.platform !== binary.platform);
          return [...filtered, binary];
        });
        setProduct((prev) =>
          prev ? { ...prev, binaries: [...(prev.binaries || []).filter((entry) => entry.platform !== binary.platform), binary] } : prev
        );
      }

      setSaveSuccess("Fichier mis à jour avec succès.");
    } catch (err: any) {
      console.error("Erreur upload binaire", err);
      setBinaryUploadError(
        err?.message || "Impossible de téléverser ce fichier pour le moment."
      );
    } finally {
      setIsUploadingBinary(false);
      event.target.value = "";
    }
  };

  if (!id) {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-red-600">
            Identifiant de produit manquant dans l&apos;URL.
          </p>
        </section>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-600">
            Chargement du produit téléchargeable...
          </p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/admin/telechargements")}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
          >
            Retour à la liste des logiciels
          </button>
        </section>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-xs text-slate-600">Produit introuvable.</p>
          <button
            type="button"
            onClick={() => navigate("/admin/telechargements")}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
          >
            Retour à la liste des logiciels
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-black">
            Modifier le logiciel téléchargeable
          </h1>
          <p className="text-xs text-slate-600">
            Vous pouvez ici mettre à jour le titre, les descriptions, le prix et le statut de publication du logiciel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/telechargements")}
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
        >
          Retour à la liste
        </button>
      </section>

      {id && (
        <SeoOverrideEditor
          targetType="product"
          targetId={id}
          targetLabel={product.name}
        />
      )}

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
        {saveSuccess && <p className="text-xs text-emerald-600">{saveSuccess}</p>}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Titre du logiciel
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Description courte
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Description longue
            </label>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
              rows={6}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Catégorie</label>
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
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
              Utilisée pour filtrer les logiciels sur la page publique.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Image de vignette (format carré)
            </label>
            <input
              type="url"
              value={cardImageUrl}
              onChange={(e) => setCardImageUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://cdn.exemple.com/visuels/vignette.png"
            />
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <input
                type="file"
                accept="image/*"
                onChange={handleCardImageUpload}
                className="text-[11px]"
              />
              {isUploadingCardImage && <span>Import en cours...</span>}
            </div>
            {cardImageError && (
              <p className="text-[11px] text-red-600">{cardImageError}</p>
            )}
            {cardImageUrl && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
                <img
                  src={resolveAssetUrl(cardImageUrl)}
                  alt="Prévisualisation de la vignette"
                  className="h-12 w-12 rounded object-cover"
                />
                <button
                  type="button"
                  className="text-slate-500 hover:text-black"
                  onClick={() => setCardImageUrl("")}
                >
                  Supprimer
                </button>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Image dédiée aux vignettes du carrousel (format carré conseillé).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Visuel principal (page descriptif)
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
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
            {thumbnailError && (
              <p className="text-[11px] text-red-600">{thumbnailError}</p>
            )}
            {thumbnailUrl && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
                <img
                  src={resolveAssetUrl(thumbnailUrl)}
                  alt="Prévisualisation du visuel"
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
              Image par défaut affichée dans la page descriptive.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-dashed border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">
                  Visuels supplémentaires et descriptions
                </p>
                <p className="text-[11px] text-slate-500">
                  Chaque image peut avoir sa description dédiée pour le carrousel de fiche produit.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSlide}
                className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-black hover:text-black"
              >
                Ajouter un visuel
              </button>
            </div>

            {slideUploadError && (
              <p className="text-[11px] text-red-600">{slideUploadError}</p>
            )}

            {detailSlides.length === 0 && (
              <p className="text-[11px] text-slate-600">
                Aucun visuel additionnel pour le moment.
              </p>
            )}

            <div className="space-y-3">
              {detailSlides.map((slide, index) => (
                <div
                  key={`slide-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Description associée
                      </label>
                      <textarea
                        value={slide.description}
                        onChange={(e) =>
                          handleSlideChange(index, "description", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                        rows={3}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlide(index)}
                      className="text-[11px] font-semibold text-slate-500 transition hover:text-red-600"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Image du visuel
                    </label>
                    <input
                      type="url"
                      value={slide.imageUrl}
                      onChange={(e) =>
                        handleSlideChange(index, "imageUrl", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="https://cdn.exemple.com/visuels/screenshot.png"
                    />
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleSlideImageUpload(index, event)}
                        className="text-[11px]"
                      />
                      {uploadingSlideIndex === index && <span>Import en cours...</span>}
                    </div>
                    {slide.imageUrl && (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-700">
                        <img
                          src={resolveAssetUrl(slide.imageUrl)}
                          alt="Aperçu du visuel"
                          className="h-12 w-12 rounded object-cover"
                        />
                        <button
                          type="button"
                          className="text-slate-500 hover:text-black"
                          onClick={() => handleSlideChange(index, "imageUrl", "")}
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Versions téléchargeables
              </h3>
              {isUploadingBinary && (
                <span className="text-[11px] text-slate-500">
                  Import en cours...
                </span>
              )}
            </div>
            {binaryUploadError && (
              <p className="text-[11px] text-red-600">{binaryUploadError}</p>
            )}
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-700">
              {binaries.length ? (
                binaries.map((binary) => (
                  <span
                    key={binary.id}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-slate-800 shadow-sm"
                  >
                    {platformLabel(binary.platform)}
                    <span className="font-normal text-slate-600">
                      ({formatFileSize(binary.fileSize)})
                    </span>
                    <span className="text-slate-400">• {binary.fileName}</span>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-600">
                  Aucun fichier n’a encore été importé pour ce logiciel.
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={binaryPlatform}
                onChange={(e) => setBinaryPlatform(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black sm:max-w-[220px]"
              >
                <option value="WINDOWS">Windows</option>
                <option value="MACOS">MacOS</option>
              </select>
              <input type="file" onChange={handleBinaryUpload} className="text-[11px]" />
            </div>
            <p className="text-[11px] text-slate-600">
              Uploadez un binaire ou une archive quel que soit le poids. Vous pouvez remplacer une version existante en sélectionnant le même OS.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Prix (en euros)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="ex : 49.90"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Produit publié
              </span>
              <button
                type="button"
                onClick={() => setIsActive((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full border transition ${
                  isActive
                    ? "border-black bg-black"
                    : "border-slate-300 bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    isActive ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Enregistrement..." : "Mettre à jour le produit"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AdminDownloadEditPage;
