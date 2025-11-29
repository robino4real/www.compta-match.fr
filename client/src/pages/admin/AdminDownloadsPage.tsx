import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface DownloadableProduct {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  fileName: string;
  fileSize: number;
  isActive: boolean;
  createdAt: string;
}

const AdminDownloadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [priceEuros, setPriceEuros] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [longDescription, setLongDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

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

      const response = await fetch(`${API_BASE_URL}/catalog/downloads`, {
        method: "GET",
        credentials: "include",
      });

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
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
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

    const formData = new FormData();
    formData.append("name", name.trim());
    if (slug.trim()) {
      formData.append("slug", slug.trim());
    }
    formData.append("priceCents", String(priceCents));
    if (shortDescription.trim()) {
      formData.append("shortDescription", shortDescription.trim());
    }
    if (longDescription.trim()) {
      formData.append("longDescription", longDescription.trim());
    }
    if (file) {
      formData.append("file", file);
    }

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
        setPriceEuros("");
        setShortDescription("");
        setLongDescription("");
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

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">
          Gestion des logiciels téléchargeables
        </h1>
        <p className="text-xs text-slate-600">
          Depuis cet espace, vous pouvez ajouter un nouveau logiciel à la vitrine
          en important le fichier exécutable ou l&apos;archive depuis votre ordinateur.
          Les produits créés ici pourront ensuite être proposés à la vente sur le site.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-black">
          Ajouter un nouveau produit téléchargeable
        </h2>

        {error && <p className="text-[11px] text-red-600">{error}</p>}
        {success && <p className="text-[11px] text-emerald-600">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom + Slug */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-800">
                Nom du logiciel *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="ComptaMini - Edition comptabilité générale"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-800">
                Slug (optionnel)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="comptamini-compta-generale"
              />
              <p className="text-[11px] text-slate-500">
                Si laissé vide, un identifiant sera généré automatiquement à partir du
                nom.
              </p>
            </div>
          </div>

          {/* Prix */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-800">
              Prix TTC (en euros) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="49,90"
              required
            />
            <p className="text-[11px] text-slate-500">
              Le montant sera automatiquement converti en centimes côté serveur.
            </p>
          </div>

          {/* Descriptions */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-800">
              Courte description
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Résumé rapide affiché dans la vitrine."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-800">
              Description détaillée
            </label>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black min-h-[100px]"
              placeholder="Description complète du logiciel, fonctionnalités, prérequis, etc."
            />
          </div>

          {/* Fichier */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-800">
              Fichier du logiciel (EXE, DMG, ZIP) *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white hover:file:text-black hover:file:border hover:file:border-black"
              required
            />
            <p className="text-[11px] text-slate-500">
              Le fichier sera stocké sur le serveur. Assurez-vous d&apos;uploader la version
              correcte du logiciel (Windows, macOS, etc.).
            </p>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Création en cours..." : "Créer le produit"}
          </button>
        </form>

        <p className="text-[11px] text-slate-500">
          Remarque : pour les tests de développement, le fichier est stocké sur le
          serveur dans un dossier interne. Plus tard, une logique de droits d&apos;accès et
          de lien de téléchargement client sera mise en place.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black">
            Liste des logiciels téléchargeables
          </h2>
          {isLoadingProducts && (
            <span className="text-[11px] text-slate-500">
              Chargement en cours...
            </span>
          )}
        </div>

        {errorProducts && (
          <p className="text-[11px] text-red-600">
            {errorProducts}
          </p>
        )}

        {!isLoadingProducts && !errorProducts && products.length === 0 && (
          <p className="text-[11px] text-slate-500">
            Aucun produit téléchargeable n&apos;a encore été créé.
          </p>
        )}

        {!isLoadingProducts && !errorProducts && products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Nom
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Slug
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Prix
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Fichier
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Taille
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Actif
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Créé le
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const priceEuros = (product.priceCents ?? 0) / 100;
                  const sizeMb = product.fileSize
                    ? product.fileSize / (1024 * 1024)
                    : 0;
                  const sizeLabel =
                    product.fileSize ? `${sizeMb.toFixed(2)} Mo` : "—";
                  const created = product.createdAt
                    ? new Date(product.createdAt).toISOString().slice(0, 10)
                    : "—";

                  return (
                    <tr key={product.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2 align-top text-slate-800">
                        {product.name}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {product.slug}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {priceEuros.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {product.fileName}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {sizeLabel}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {product.isActive ? "Oui" : "Non"}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {created}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/telechargements/${product.id}`)
                          }
                          className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDownloadsPage;
