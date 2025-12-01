import React, { useEffect, useMemo, useState } from "react";
import { DownloadableProduct } from "../../types/downloadableProduct";
import { formatPrice } from "../../lib/formatPrice";
import { useCart } from "../../context/CartContext";
import { API_BASE_URL } from "../../config/api";

const skeletonItems = Array.from({ length: 3 });

const buildImageList = (product: DownloadableProduct | null) => {
  if (!product) return [];
  const urls = [product.heroImageUrl, ...(product.galleryUrls || [])].filter(
    (url): url is string => Boolean(url)
  );

  return Array.from(new Set(urls));
};

export const DownloadableProductsSection: React.FC = () => {
  const { addDownloadableProduct } = useCart();
  const [products, setProducts] = useState<DownloadableProduct[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<DownloadableProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${API_BASE_URL}/downloadable-products/public`
        );
        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json?.message || "Impossible de charger les logiciels disponibles."
          );
        }

        const incoming: DownloadableProduct[] = Array.isArray(json?.products)
          ? json.products
          : [];

        if (!isMounted) return;

        setProducts(incoming);
        setSelectedProduct(incoming[0] ?? null);
        setImageIndex(0);
      } catch (err: any) {
        console.error("Erreur de chargement des produits téléchargeables", err);
        if (!isMounted) return;
        setError(
          err?.message ||
            "Une erreur est survenue lors du chargement des logiciels disponibles."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentImages = useMemo(() => buildImageList(selectedProduct), [
    selectedProduct,
  ]);

  useEffect(() => {
    setImageIndex(0);
  }, [selectedProduct?.id]);

  useEffect(() => {
    setIsFading(true);
    const timeout = window.setTimeout(() => setIsFading(false), 50);

    return () => window.clearTimeout(timeout);
  }, [imageIndex, selectedProduct?.id]);

  const handleSelect = (product: DownloadableProduct) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: DownloadableProduct) => {
    addDownloadableProduct({
      id: product.id,
      name: product.name,
      priceCents: Math.round(product.priceTtc * 100),
    });
  };

  const renderCards = () => {
    if (loading) {
      return skeletonItems.map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          className="min-w-[260px] max-w-[320px] rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
        >
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-6 h-8 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-6 h-10 w-full animate-pulse rounded-full bg-slate-200" />
        </div>
      ));
    }

    if (!products.length) {
      return (
        <div className="flex min-h-[160px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          <p>Aucun logiciel n’est encore disponible à la vente.</p>
          <p className="mt-1">Revenez bientôt ou contactez-nous pour plus d’informations.</p>
        </div>
      );
    }

    return products.map((product) => (
      <article
        key={product.id}
        role="button"
        tabIndex={0}
        onClick={() => handleSelect(product)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleSelect(product);
          }
        }}
        aria-pressed={selectedProduct?.id === product.id}
        className={`min-w-[260px] max-w-[320px] rounded-3xl border border-slate-200 bg-white px-6 py-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
          selectedProduct?.id === product.id
            ? "ring-2 ring-slate-900 shadow-xl scale-[1.03]"
            : ""
        }`}
      >
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
            <p className="mt-1 line-clamp-3 text-sm text-slate-600">
              {product.shortDescription}
            </p>
          </div>
          {product.badge && (
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
              {product.badge}
            </span>
          )}
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold text-slate-900">
              {formatPrice(product.priceTtc)} TTC
            </div>
            <span className="text-xs font-semibold text-slate-500">{product.currency}</span>
          </div>
          <div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleAddToCart(product);
              }}
              className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900"
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </article>
    ));
  };

  const renderDetails = () => {
    if (loading) {
      return (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-3">
            <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-6 flex gap-3">
              <div className="h-10 w-32 animate-pulse rounded-full bg-slate-200" />
              <div className="h-10 w-40 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="h-72 rounded-3xl border border-slate-200 bg-slate-100 animate-pulse" />
        </div>
      );
    }

    if (!selectedProduct) {
      if (!products.length) return null;
      return (
        <p className="text-sm text-slate-600">
          Sélectionnez un logiciel pour voir le détail.
        </p>
      );
    }

    const features = selectedProduct.tags || [];
    const images = currentImages;
    const currentImageUrl = images[imageIndex] || null;

    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              {selectedProduct.name}
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 md:text-base">
              {selectedProduct.longDescription}
            </p>
          </div>

          {!!features.length && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-900">Fonctionnalités clés</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-slate-900" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-xl font-semibold text-slate-900">
              {formatPrice(selectedProduct.priceTtc)} TTC
            </div>
            <button
              type="button"
              onClick={() => handleAddToCart(selectedProduct)}
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-900"
            >
              Ajouter au panier
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Voir la fiche complète
            </button>
          </div>
        </div>

        <div>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
            {currentImageUrl ? (
              <img
                key={`${selectedProduct.id}-${imageIndex}`}
                src={currentImageUrl}
                alt={selectedProduct.name}
                className={`block h-auto w-full object-cover transition-opacity duration-500 ease-out ${
                  isFading ? "opacity-0" : "opacity-100"
                }`}
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm font-semibold text-slate-500">
                Visuel à venir
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              {images.map((imageUrl, idx) => (
                <button
                  key={imageUrl}
                  type="button"
                  aria-label={`Afficher l’aperçu ${idx + 1}`}
                  onClick={() => setImageIndex(idx)}
                  className={`h-2 w-6 rounded-full bg-slate-200 transition-colors ${
                    idx === imageIndex ? "bg-slate-900" : ""
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-8 rounded-3xl border border-slate-100 bg-white px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:px-10 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">Sélectionnez un logiciel</p>
          <p className="text-sm text-slate-600">Choisissez une offre pour afficher les détails et les visuels.</p>
        </div>
        {error && (
          <div className="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0">
        {renderCards()}
      </div>

      <div className="border-t border-slate-100 pt-4">
        {renderDetails()}
      </div>
    </section>
  );
};

export default DownloadableProductsSection;
