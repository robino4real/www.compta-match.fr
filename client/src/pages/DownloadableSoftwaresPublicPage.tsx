import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StructuredDataScript from "../components/StructuredDataScript";
import { API_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";

export type PublicDownloadableProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  priceTtcFormatted: string;
  badge?: string | null;
  heroImageUrl?: string | null;
  screenshots?: string[];
  targetAudience?: string[];
  keyFeatures?: string[];
  priceCents?: number;
};

function formatInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function DownloadableSoftwaresPublicPage() {
  const [products, setProducts] = useState<PublicDownloadableProduct[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const [structuredData, setStructuredData] = useState<any[] | null>(null);

  const { addDownloadableProduct } = useCart();

  const selectedProduct = products[selectedIndex];

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/public/downloadable-products`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("Erreur de chargement des logiciels.");

        const parsedProducts = Array.isArray((data as any)?.products)
          ? ((data as any)?.products as PublicDownloadableProduct[])
          : Array.isArray(data)
          ? (data as PublicDownloadableProduct[])
          : [];

        setProducts(parsedProducts);
        setStructuredData(
          Array.isArray((data as any)?.structuredData)
            ? (data as any).structuredData
            : null
        );
        setSelectedIndex(0);
      } catch (e: any) {
        setError(e?.message ?? "Erreur inconnue.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentScreenshotIndex(0);
  }, [selectedIndex]);

  function handlePrev() {
    if (products.length === 0) return;
    setSelectedIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  }

  function handleNext() {
    if (products.length === 0) return;
    setSelectedIndex((prev) =>
      prev === products.length - 1 ? 0 : prev + 1
    );
  }

  function handleAddToCart(product: PublicDownloadableProduct) {
    if (typeof product.priceCents !== "number") {
      alert("Ce produit n'est pas encore disponible à l'achat en ligne.");
      return;
    }

    addDownloadableProduct({
      id: product.id,
      name: product.name,
      priceCents: product.priceCents,
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-slate-500">Chargement des logiciels…</p>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-xl text-center bg-white rounded-3xl shadow-lg px-8 py-10">
          <h1 className="text-2xl font-semibold mb-3 text-slate-900">
            Logiciels téléchargeables COMPTAMATCH
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            {error
              ? error
              : "Aucun logiciel n’est disponible pour le moment."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-12">
      <StructuredDataScript data={structuredData} />
      <section className="bg-white rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] px-6 md:px-12 py-10 md:py-12">
        <h1 className="text-2xl md:text-4xl font-semibold text-slate-900 text-center">
          Logiciels téléchargeables COMPTAMATCH
        </h1>
        <p className="mt-4 text-sm md:text-base text-slate-500 text-center max-w-2xl mx-auto">
          Pilotez vos outils comptables en toute simplicité : explorez nos
          logiciels, découvrez leurs points forts et ajoutez-les en un clic
          à votre panier.
        </p>
      </section>

      <section className="bg-white rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] px-4 md:px-8 py-8 md:py-10 space-y-8 md:space-y-10">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between px-2 md:px-1">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              Sélectionnez un logiciel
            </h2>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={handlePrev}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-md items-center justify-center border border-slate-100 hover:shadow-lg transition"
              aria-label="Logiciel précédent"
            >
              <span className="text-lg">‹</span>
            </button>

            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-1 md:px-6 py-1">
              {products.map((product, index) => {
                const isActive = index === selectedIndex;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={[
                      "flex-shrink-0 w-64 md:w-72 rounded-3xl border bg-white px-5 py-6 text-left transition-all",
                      "hover:-translate-y-1 hover:shadow-lg",
                      isActive
                        ? "border-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.15)] scale-[1.04]"
                        : "border-slate-100 shadow-sm",
                    ].join(" ")}
                  >
                    <div className="mb-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white text-xs font-semibold">
                        {formatInitials(product.name)}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                      {product.shortDescription}
                    </p>

                    {product.badge && (
                      <div className="inline-flex rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-medium text-slate-600 mb-4">
                        {product.badge}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {product.priceTtcFormatted}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="rounded-full bg-slate-900 text-white text-[11px] font-semibold px-3 py-2 hover:bg-black transition"
                      >
                        Ajouter au panier
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-md items-center justify-center border border-slate-100 hover:shadow-lg transition"
              aria-label="Logiciel suivant"
            >
              <span className="text-lg">›</span>
            </button>
          </div>
        </div>

        {selectedProduct && (
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-start">
            <div className="space-y-5 md:space-y-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
                {selectedProduct.name}
              </h2>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                {selectedProduct.longDescription || selectedProduct.shortDescription}
              </p>

              {selectedProduct.targetAudience && selectedProduct.targetAudience.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Pensé pour :
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                    {selectedProduct.targetAudience.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Prix TTC
                  </div>
                  <div className="text-xl font-semibold text-slate-900">
                    {selectedProduct.priceTtcFormatted}
                  </div>
                </div>

                <Link
                  to={`/telechargements/${selectedProduct.slug}`}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-xs md:text-sm font-semibold px-5 py-2.5 hover:bg-black transition"
                >
                  Voir la fiche complète
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden shadow-inner min-h-[220px] md:min-h-[260px] flex items-center justify-center">
                {selectedProduct.screenshots && selectedProduct.screenshots.length > 0 ? (
                  <img
                    key={`${selectedProduct.id}-${currentScreenshotIndex}`}
                    src={
                      selectedProduct.screenshots[currentScreenshotIndex]
                    }
                    alt={`Capture d’écran ${currentScreenshotIndex + 1} de ${selectedProduct.name}`}
                    className="w-full h-full object-cover opacity-0 animate-fadeInSlow"
                  />
                ) : selectedProduct.heroImageUrl ? (
                  <img
                    src={selectedProduct.heroImageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover opacity-0 animate-fadeInSlow"
                  />
                ) : (
                  <div className="px-6 py-10 text-center text-xs text-slate-400">
                    Bientôt un aperçu de l’interface de {selectedProduct.name}.
                  </div>
                )}
              </div>

              {selectedProduct.screenshots && selectedProduct.screenshots.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {selectedProduct.screenshots.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentScreenshotIndex(idx)}
                      className={[
                        "h-2.5 w-2.5 rounded-full transition",
                        idx === currentScreenshotIndex
                          ? "bg-slate-900"
                          : "bg-slate-300",
                      ].join(" ")}
                      aria-label={`Afficher la capture ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {selectedProduct.keyFeatures && selectedProduct.keyFeatures.length > 0 && (
                <div className="bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4">
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">
                    Fonctionnalités clés :
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-slate-600">
                    {selectedProduct.keyFeatures.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default DownloadableSoftwaresPublicPage;
