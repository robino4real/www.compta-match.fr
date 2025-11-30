import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import StructuredDataScript from "../components/StructuredDataScript";
import { API_BASE_URL } from "../config/api";

interface DownloadableProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  featureBullets?: string[];
  detailHtml?: string | null;
  priceCents: number;
}

const DownloadsPage: React.FC = () => {
  const { addDownloadableProduct } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = React.useState<DownloadableProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [structuredData, setStructuredData] = React.useState<any[] | null>(null);
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/public/downloadable-products`,
          {
          method: "GET",
          credentials: "include",
          }
        );

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
        if (list.length > 0) {
          setSelectedProductId(list[0].id);
        }
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
  const selectedProduct = hasProducts
    ? products.find((product) => product.id === selectedProductId) ?? products[0]
    : null;

  return (
    <div className="space-y-6">
      <StructuredDataScript data={structuredData} />
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black">
              Logiciels téléchargeables COMPTAMATCH
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Pilotez vos outils comptables en toute simplicité : explorez nos logiciels,
              découvrez leurs points forts et ajoutez-les en un clic à votre panier.
            </p>
          </div>
          <button
            type="button"
            onClick={() => selectedProduct && navigate(`/telechargements/${selectedProduct.slug}`)}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-black hover:border-black hover:bg-black hover:text-white transition"
          >
            Voir la fiche détaillée
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
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
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-black">Sélectionnez un logiciel</h2>
              <span className="text-[11px] text-slate-500">Glissez horizontalement pour découvrir les logiciels</span>
            </div>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {products.map((product) => {
                  const priceEuros = (product.priceCents ?? 0) / 100;
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <article
                      key={product.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedProductId(product.id)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedProductId(product.id)}
                      className={`snap-start w-[260px] flex-shrink-0 rounded-2xl border bg-white transition duration-200 shadow-sm ${
                        isSelected
                          ? "border-black scale-[1.03] shadow-lg"
                          : "border-slate-200 hover:scale-[1.02] hover:shadow-md"
                      }`}
                    >
                      {product.thumbnailUrl && (
                        <img
                          src={product.thumbnailUrl}
                          alt={`Visuel ${product.name}`}
                          className="h-36 w-full rounded-t-2xl object-cover"
                        />
                      )}
                      <div className="p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-black line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-slate-600 line-clamp-2 min-h-[32px]">
                          {product.shortDescription || "Logiciel comptable COMPTAMATCH"}
                        </p>
                        {product.featureBullets && product.featureBullets.length > 0 && (
                          <ul className="space-y-1 text-[11px] text-slate-700">
                            {product.featureBullets.slice(0, 4).map((bullet, index) => (
                              <li key={`${product.id}-bullet-${index}`} className="flex items-start gap-1">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black" />
                                <span className="leading-tight">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="pt-2 space-y-2">
                          <p className="text-sm font-semibold text-black">
                            {priceEuros.toFixed(2)} €
                            <span className="text-[11px] font-normal text-slate-500"> TTC</span>
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
                          >
                            Ajouter au panier
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {selectedProduct && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-inner space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase text-slate-500">Logiciel sélectionné</p>
                    <h3 className="text-lg font-semibold text-black">{selectedProduct.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(selectedProduct)}
                      className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
                    >
                      Ajouter au panier
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/telechargements/${selectedProduct.slug}`)}
                      className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-black hover:border-black hover:bg-black hover:text-white transition"
                    >
                      Voir la fiche
                    </button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: selectedProduct.detailHtml || "<p>Retrouvez ici la description détaillée du logiciel.</p>" }} />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default DownloadsPage;
