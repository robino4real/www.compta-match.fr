import React from "react";
import { useCart } from "../context/CartContext";
import StructuredDataScript from "../components/StructuredDataScript";
import { API_BASE_URL } from "../config/api";

interface DownloadableProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  priceCents: number;
  currency: string;
  isActive: boolean;
  createdAt?: string | null;
}

const DownloadsPage: React.FC = () => {
  const { addDownloadableProduct } = useCart();

  const [products, setProducts] = React.useState<DownloadableProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [structuredData, setStructuredData] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/catalog/downloads`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Impossible de récupérer la liste des logiciels téléchargeables."
          );
        }

        const list = Array.isArray(data.products) ? data.products : [];
        setProducts(list);
        setStructuredData(Array.isArray((data as any)?.structuredData) ? (data as any).structuredData : null);
      } catch (err: any) {
        console.error("Erreur /catalog/downloads :", err);
        setError(
          err?.message ||
            "Une erreur est survenue lors du chargement des logiciels téléchargeables."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: DownloadableProduct) => {
    if (!product.id || product.priceCents == null) {
      alert("Ce produit ne peut pas être ajouté au panier pour le moment.");
      return;
    }

    addDownloadableProduct({
      id: product.id,
      name: product.name,
      priceCents: product.priceCents,
    });

    alert(`"${product.name}" a été ajouté à votre panier.`);
  };

  const hasProducts = !isLoading && !error && products.length > 0;

  return (
    <div className="space-y-6">
      <StructuredDataScript data={structuredData} />
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">
          Logiciels téléchargeables COMPTAMATCH
        </h1>
        <p className="text-xs text-slate-600">
          Retrouvez ici l&apos;ensemble des logiciels de comptabilité proposés au
          téléchargement. Une fois l&apos;achat réalisé, vous pourrez récupérer
          le fichier directement depuis votre espace client.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {isLoading && (
          <p className="text-xs text-slate-500">
            Chargement des logiciels en cours...
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}

        {!isLoading && !error && products.length === 0 && (
          <p className="text-xs text-slate-500">
            Aucun logiciel téléchargeable n&apos;est disponible pour le moment.
          </p>
        )}

        {hasProducts && (
          <div className="grid gap-4 md:grid-cols-3">
            {products.map((product) => {
              const priceEuros = (product.priceCents ?? 0) / 100;
              const description =
                product.shortDescription ||
                product.longDescription ||
                "Logiciel de comptabilité téléchargeable proposé par COMPTAMATCH.";

              return (
                <article
                  key={product.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-black">
                      {product.name}
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      {description}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-black">
                      {priceEuros.toFixed(2)} €{" "}
                      <span className="text-[11px] font-normal text-slate-500">
                        TTC – paiement unique
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="mt-1 w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default DownloadsPage;
