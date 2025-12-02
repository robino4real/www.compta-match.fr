import React, { useEffect, useMemo, useState } from "react";
import { DownloadableProduct } from "../../types/downloadableProduct";
import { formatPrice } from "../../lib/formatPrice";
import { useCart } from "../../context/CartContext";
import { API_BASE_URL } from "../../config/api";

const skeletonItems = Array.from({ length: 3 });
const CARD_WIDTH = 320;
const CARD_GAP = 28;
const VISIBLE_CARDS = 3;

type DetailSlide = { imageUrl?: string | null; description?: string | null };

const buildDetailSlides = (
  product: DownloadableProduct | null
): DetailSlide[] => {
  if (!product) return [];

  if (Array.isArray(product.detailSlides) && product.detailSlides.length) {
    return product.detailSlides
      .map((slide) => ({
        imageUrl: slide?.imageUrl || undefined,
        description:
          slide?.description ??
          product.longDescription ??
          product.shortDescription ??
          "",
      }))
      .filter((slide) => slide.imageUrl || slide.description);
  }

  const fallbackDescription =
    product.longDescription || product.shortDescription || "";

  const urls = [product.heroImageUrl, ...(product.galleryUrls || [])].filter(
    (url): url is string => Boolean(url)
  );

  const uniqueUrls = Array.from(new Set(urls));

  if (uniqueUrls.length) {
    return uniqueUrls.map((url) => ({
      imageUrl: url,
      description: fallbackDescription,
    }));
  }

  return [
    {
      imageUrl: undefined,
      description: fallbackDescription,
    },
  ];
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
  const [currentIndex, setCurrentIndex] = useState(0);

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
        setCurrentIndex(0);
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

  const detailSlides = useMemo(
    () => buildDetailSlides(selectedProduct),
    [selectedProduct]
  );

  useEffect(() => {
    setImageIndex(0);
  }, [selectedProduct?.id, detailSlides.length]);

  useEffect(() => {
    if (imageIndex > Math.max(detailSlides.length - 1, 0)) {
      setImageIndex(0);
    }
  }, [imageIndex, detailSlides.length]);

  const currentSlide =
    detailSlides[imageIndex] || detailSlides[0] || { imageUrl: null, description: null };
  const currentImageUrl = currentSlide.imageUrl || null;
  const currentDescription =
    currentSlide.description ||
    selectedProduct?.longDescription ||
    selectedProduct?.shortDescription ||
    "";

  const maxIndex = Math.max(products.length - VISIBLE_CARDS, 0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [products.length]);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

  useEffect(() => {
    setIsFading(true);
    const timeout = window.setTimeout(() => setIsFading(false), 180);

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

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const renderCards = () => {
    if (loading) {
      return skeletonItems.map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          style={{ width: CARD_WIDTH }}
          className="flex-shrink-0 rounded-3xl border border-slate-100 bg-white px-7 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-6 h-9 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-6 h-10 w-full animate-pulse rounded-full bg-slate-200" />
        </div>
      ));
    }

    if (!products.length) {
      return (
        <div className="flex min-h-[160px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-600 shadow-[0_24px_60px_rgba(15,23,42,0.05)]">
          Aucun logiciel n’est disponible pour le moment. Veuillez revenir plus tard.
        </div>
      );
    }

    return products.map((product) => (
      <article
        key={product.id}
        role="button"
        onClick={() => handleSelect(product)}
        style={{ width: CARD_WIDTH }}
        className={`group flex-shrink-0 cursor-pointer rounded-3xl px-7 py-6 text-center transition-all duration-200 ${
          selectedProduct?.id === product.id
            ? "bg-slate-50 shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
            : "bg-white hover:-translate-y-1 hover:bg-slate-50 hover:shadow-[0_18px_44px_rgba(15,23,42,0.1)]"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
            {product.cardImageUrl ? (
              <img
                src={product.cardImageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Visuel à venir
              </span>
            )}
          </div>
          <h3 className="text-2xl font-semibold text-slate-900">{product.name}</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            {product.shortDescription}
          </p>
          {product.badge && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
              {product.badge}
            </span>
          )}
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-4xl font-semibold leading-none">
              {formatPrice(product.priceTtc)}
            </span>
            <span className="text-sm font-semibold uppercase text-slate-500">
              {product.priceDisplayMode === "HT" ? "HT" : "TTC"}
            </span>
          </div>
        </div>
      </article>
    ));
  };

  const renderDetails = () => {
    if (loading) {
      return (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
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
          <div className="h-72 rounded-3xl bg-slate-100 animate-pulse" />
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
    const priceLabel = selectedProduct.priceDisplayMode === "HT" ? "HT" : "TTC";

    return (
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {selectedProduct.name}
            </h3>
            <p
              className={`text-base leading-relaxed text-slate-700 transition-opacity duration-500 ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            >
              {currentDescription}
            </p>
          </div>

          {!!features.length && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Fonctionnalités clés
              </h4>
              <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-slate-900" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-2xl font-semibold text-slate-900">
              {formatPrice(selectedProduct.priceTtc)} {priceLabel}
            </div>
            <button
              type="button"
              onClick={() => handleAddToCart(selectedProduct)}
              className="pressable-button inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Ajouter au panier
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white p-6">
          <div className="relative overflow-hidden rounded-2xl bg-white">
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

          {detailSlides.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              {detailSlides.map((slide, idx) => (
                <button
                  key={slide.imageUrl ?? `slide-${idx}`}
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

  const showNavigation = !loading && products.length > VISIBLE_CARDS;
  const translateX = showNavigation ? currentIndex * (CARD_WIDTH + CARD_GAP) : 0;
  const viewportWidth = useMemo(
    () => VISIBLE_CARDS * CARD_WIDTH + CARD_GAP * (VISIBLE_CARDS - 1),
    []
  );

  return (
    <section className="space-y-8">
      {error && (
        <div className="flex justify-center">
          <div className="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
            {error}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="relative">
          {showNavigation && (
            <>
              <div className="absolute inset-y-0 -left-12 flex items-center">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.14)] transition hover:shadow-[0_14px_36px_rgba(15,23,42,0.16)] disabled:opacity-40"
                  aria-label="Afficher les logiciels précédents"
                >
                  ←
                </button>
              </div>
              <div className="absolute inset-y-0 -right-12 flex items-center">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === maxIndex}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.14)] transition hover:shadow-[0_14px_36px_rgba(15,23,42,0.16)] disabled:opacity-40"
                  aria-label="Afficher les logiciels suivants"
                >
                  →
                </button>
              </div>
            </>
          )}

          <div
            className="mx-auto overflow-hidden"
            style={{ maxWidth: viewportWidth, width: "100%" }}
          >
            <div
              className={`flex gap-7 py-2 transition-transform duration-500 ease-out ${
                showNavigation ? "" : "flex-wrap justify-center"
              }`}
              style={
                showNavigation
                  ? {
                      transform: `translateX(-${translateX}px)`,
                    }
                  : undefined
              }
            >
              {renderCards()}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        {renderDetails()}
      </div>
    </section>
  );
};

export default DownloadableProductsSection;
