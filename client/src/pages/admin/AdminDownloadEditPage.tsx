import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { uploadAdminImage } from "../../lib/adminUpload";

interface AdminDownloadProduct {
  id: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  priceCents: number;
  currency: string;
  isActive: boolean;
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
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [thumbnailError, setThumbnailError] = React.useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = React.useState(false);
  const [priceEuros, setPriceEuros] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
        setThumbnailUrl(prod.thumbnailUrl ?? "");
        setPriceEuros(
          typeof prod.priceCents === "number"
            ? (prod.priceCents / 100).toString()
            : ""
        );
        setIsActive(Boolean(prod.isActive));
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
  }, [id]);

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
        thumbnailUrl: thumbnailUrl.trim() || null,
        priceCents: Math.round(parsedPrice * 100),
        isActive,
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

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Vignette / visuel
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
                  src={thumbnailUrl}
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
              URL ou import direct pour illustrer la fiche produit.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Prix TTC (en euros)
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
