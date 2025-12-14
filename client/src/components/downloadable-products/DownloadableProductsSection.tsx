import React, { useEffect, useMemo, useState } from "react";
import {
  DownloadableCategory,
  DownloadableProduct,
} from "../../types/downloadableProduct";
import { formatPrice } from "../../lib/formatPrice";
import { useCart } from "../../context/CartContext";
import { API_BASE_URL } from "../../config/api";

const skeletonItems = Array.from({ length: 3 });
const CARD_WIDTH = 320;
const CARD_GAP = 28;
const VISIBLE_CARDS = 3;

type DetailSlide = { imageUrl?: string | null; description?: string | null };

type BuiltSlides = { slides: DetailSlide[]; fromBackOffice: boolean };

const buildDetailSlides = (
  product: DownloadableProduct | null
): BuiltSlides => {
  if (!product) return { slides: [], fromBackOffice: false };

  if (Array.isArray(product.detailSlides) && product.detailSlides.length) {
    const slides = product.detailSlides
      .map((slide) => ({
        imageUrl: slide?.imageUrl || undefined,
        description:
          slide?.description ??
          product.longDescription ??
          product.shortDescription ??
          "",
      }))
      .filter((slide) => slide.imageUrl || slide.description);

    if (slides.length) {
      return { slides, fromBackOffice: true };
    }
  }

  const fallbackDescription =
    product.longDescription || product.shortDescription || "";

  const urls = [product.heroImageUrl, ...(product.galleryUrls || [])].filter(
    (url): url is string => Boolean(url)
  );

  const uniqueUrls = Array.from(new Set(urls));

  if (uniqueUrls.length) {
    return {
      slides: uniqueUrls.map((url) => ({
        imageUrl: url,
        description: fallbackDescription,
      })),
      fromBackOffice: false,
    };
  }

  return {
    slides: [
      {
        imageUrl: undefined,
        description: fallbackDescription,
      },
    ],
    fromBackOffice: false,
  };
};

export const DownloadableProductsSection: React.FC = () => {
  const { addDownloadableProduct } = useCart();
  const [products, setProducts] = useState<DownloadableProduct[]>([]);
  const [categories, setCategories] = useState<DownloadableCategory[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<DownloadableProduct | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedBinaryId, setSelectedBinaryId] = useState<string | null>(null);

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
        const incomingCategories: DownloadableCategory[] = Array.isArray(
          json?.categories
        )
          ? json.categories
          : [];

        if (!isMounted) return;

        setProducts(incoming);
        setCategories(incomingCategories);
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const updateIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  const { slides: detailSlides, fromBackOffice: slidesFromBackOffice } = useMemo(
    () => buildDetailSlides(selectedProduct),
    [selectedProduct]
  );

  useEffect(() => {
    setImageIndex(0);
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (selectedProduct?.binaries?.length) {
      setSelectedBinaryId(selectedProduct.binaries[0].id);
    } else {
      setSelectedBinaryId(null);
    }
  }, [selectedProduct?.id, selectedProduct?.binaries?.length]);

  const hasMultipleDetailSlides = detailSlides.length > 1;
  const hasBackOfficeSlideSet =
    slidesFromBackOffice && detailSlides.length > 1;

  useEffect(() => {
    setImageIndex(0);
  }, [selectedProduct?.id, detailSlides.length]);

  useEffect(() => {
    if (
      selectedCategoryId &&
      !categories.some((category) => category.id === selectedCategoryId)
    ) {
      setSelectedCategoryId("");
    }
  }, [categories, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter(
      (product) => product.category?.id === selectedCategoryId
    );
  }, [products, selectedCategoryId]);

  useEffect(() => {
    if (imageIndex > Math.max(detailSlides.length - 1, 0)) {
      setImageIndex(0);
    }
  }, [imageIndex, detailSlides.length]);

  const currentSlide =
    detailSlides[imageIndex] || detailSlides[0] || { imageUrl: null, description: null };
  const currentDescription =
    currentSlide.description ||
    selectedProduct?.longDescription ||
    selectedProduct?.shortDescription ||
    "";

  const selectedBinary = useMemo(() => {
    if (!selectedProduct?.binaries?.length) return null;
    return (
      selectedProduct.binaries.find((binary) => binary.id === selectedBinaryId) ||
      selectedProduct.binaries[0]
    );
  }, [selectedBinaryId, selectedProduct?.binaries]);

  const platformLabel = (platform?: string | null) =>
    platform === "MACOS" ? "MacOS" : "Windows";

  const isAddToCartDisabled =
    !selectedProduct ||
    (!!selectedProduct.binaries?.length && !selectedBinary);

  const maxIndex = Math.max(filteredProducts.length - VISIBLE_CARDS, 0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredProducts.length]);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

  useEffect(() => {
    if (
      selectedProduct &&
      filteredProducts.some((product) => product.id === selectedProduct.id)
    ) {
      return;
    }

    setSelectedProduct(filteredProducts[0] ?? null);
  }, [filteredProducts, selectedProduct]);

  useEffect(() => {
    setIsFading(true);
    const timeout = window.setTimeout(() => setIsFading(false), 180);

    return () => window.clearTimeout(timeout);
  }, [imageIndex, selectedProduct?.id]);

  const handleSelect = (product: DownloadableProduct) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: DownloadableProduct) => {
    const binary = selectedBinary || product.binaries?.[0] || null;
    addDownloadableProduct({
      id: product.id,
      name: product.name,
      priceCents: Math.round(product.priceTtc * 100),
      binaryId: binary?.id,
      platform: binary?.platform,
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const handleSlidePrev = () => {
    setImageIndex((prev) => {
      if (!detailSlides.length) return 0;
      return prev === 0 ? detailSlides.length - 1 : prev - 1;
    });
  };

  const handleSlideNext = () => {
    setImageIndex((prev) => {
      if (!detailSlides.length) return 0;
      return prev === detailSlides.length - 1 ? 0 : prev + 1;
    });
  };

  const renderCards = () => {
    if (loading) {
      return skeletonItems.map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          style={{
            width: isMobile ? "100%" : CARD_WIDTH,
            flex: isMobile ? undefined : `0 0 ${CARD_WIDTH}px`,
          }}
          className="rounded-3xl border border-white/25 bg-white/10 px-7 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/30" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-white/30" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-white/30" />
          <div className="mt-6 h-9 w-24 animate-pulse rounded-full bg-white/30" />
          <div className="mt-6 h-10 w-full animate-pulse rounded-full bg-white/30" />
        </div>
      ));
    }

    if (!filteredProducts.length) {
      return (
        <div className="flex min-h-[160px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/30 bg-white/10 px-6 py-8 text-center text-sm text-white/80 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          {products.length
            ? "Aucun logiciel n’est disponible dans cette catégorie pour le moment."
            : "Aucun logiciel n’est disponible pour le moment. Veuillez revenir plus tard."}
        </div>
      );
    }

    return filteredProducts.map((product) => (
      <article
        key={product.id}
        role="button"
        onClick={() => handleSelect(product)}
        style={{
          width: isMobile ? "100%" : CARD_WIDTH,
          flex: isMobile ? undefined : `0 0 ${CARD_WIDTH}px`,
        }}
        className={`group cursor-pointer rounded-3xl px-7 py-6 text-center transition-all duration-200 ${
          selectedProduct?.id === product.id
            ? "border border-white/70 bg-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.32)]"
            : "border border-white/25 bg-white/10 hover:-translate-y-1 hover:border-white/50 hover:bg-white/15 hover:shadow-[0_18px_44px_rgba(0,0,0,0.28)]"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl bg-white/10 aspect-square">
            {product.cardImageUrl ? (
              <img
                src={product.cardImageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Visuel à venir
              </span>
            )}
          </div>
          <h3 className="text-2xl font-semibold text-white">{product.name}</h3>
          <p className="text-sm leading-relaxed text-white/80">
            {product.shortDescription}
          </p>
          {product.badge && (
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {product.badge}
            </span>
          )}
          <div className="flex items-center gap-2 text-white">
            <span className="text-4xl font-semibold leading-none">
              {formatPrice(product.priceTtc)}
            </span>
            <span className="text-sm font-semibold uppercase text-emerald-100/80">
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
            <div className="h-8 w-2/3 animate-pulse rounded-full bg-white/30" />
            <div className="h-4 w-full animate-pulse rounded-full bg-white/30" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/30" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/30" />
            <div className="mt-6 flex gap-3">
              <div className="h-10 w-32 animate-pulse rounded-full bg-white/30" />
              <div className="h-10 w-40 animate-pulse rounded-full bg-white/30" />
            </div>
          </div>
          <div className="h-72 rounded-3xl border border-white/20 bg-white/10 animate-pulse" />
        </div>
      );
    }

    if (!selectedProduct) {
      if (!products.length) return null;
      return (
        <p className="text-sm text-white/80">
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
            <h3 className="text-3xl font-semibold text-white md:text-4xl">
              {selectedProduct.name}
            </h3>
            <p
              className={`relative z-10 text-base leading-relaxed text-white transition-opacity duration-500 ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            >
              {currentDescription}
            </p>
            {hasBackOfficeSlideSet && (
              <div
                className="mt-2 flex items-center gap-2"
                aria-label="Pagination des visuels du descriptif"
              >
                {detailSlides.map((_, idx) => (
                  <button
                    key={`indicator-${idx}`}
                    type="button"
                    onClick={() => setImageIndex(idx)}
                    className={`h-2.5 w-2.5 rounded-full transition duration-200 ${
                      imageIndex === idx
                        ? "bg-slate-900 shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
                        : "bg-slate-300 hover:bg-slate-400"
                    }`}
                    aria-label={`Aller au visuel ${idx + 1}`}
                    aria-pressed={imageIndex === idx}
                  />
                ))}
              </div>
            )}
          </div>

          {!!features.length && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-100/80">
                Fonctionnalités clés
              </h4>
              <ul className="mt-3 grid gap-2 text-sm text-white">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-300" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
                Version du logiciel
              </h4>
              {selectedProduct?.binaries?.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.binaries.map((binary) => {
                    const isActive = binary.id === selectedBinary?.id;
                    return (
                      <button
                        key={binary.id}
                        type="button"
                        onClick={() => setSelectedBinaryId(binary.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          isActive
                            ? "border-white bg-white/20 text-white shadow-lg"
                            : "border-white/40 bg-white/10 text-white hover:border-white"
                        }`}
                        aria-pressed={isActive}
                      >
                        {platformLabel(binary.platform)}
                        <span className="text-[11px] font-normal text-current">
                          {binary.fileSize
                            ? `${(binary.fileSize / (1024 * 1024)).toFixed(1)} Mo`
                            : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-white">
                  Les fichiers d’installation seront ajoutés prochainement.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
            <div className="text-2xl font-semibold text-white">
              {formatPrice(selectedProduct.priceTtc)} {priceLabel}
            </div>
            <button
              type="button"
              onClick={() => handleAddToCart(selectedProduct)}
              disabled={isAddToCartDisabled}
              className="pressable-button inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/40 transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:border-white/30 disabled:bg-white/20 disabled:text-white"
            >
              Ajouter au panier
            </button>
            </div>
          </div>
        </div>

        <div className="overflow-visible rounded-3xl p-6">
          <div className="relative overflow-visible rounded-2xl bg-transparent shadow-none">
            <div className="overflow-hidden rounded-2xl bg-transparent shadow-none">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${imageIndex * 100}%)` }}
              >
                {detailSlides.map((slide, idx) => {
                  const isActiveSlide = idx === imageIndex;

                  return (
                    <div key={slide.imageUrl ?? `slide-${idx}`} className="w-full flex-shrink-0">
                      {slide.imageUrl ? (
                        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                          <img
                            src={slide.imageUrl}
                            alt={selectedProduct.name}
                            className={`h-full w-full object-contain transition-opacity duration-500 ease-out ${
                              isActiveSlide && isFading ? "opacity-0" : "opacity-100"
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-white/20 bg-white/5 p-4 text-sm font-semibold text-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                          Visuel à venir
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {hasMultipleDetailSlides && (
              <>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-200/25 via-transparent to-emerald-200/25 opacity-70" aria-hidden />
                <div className="absolute inset-y-0 left-0 flex -translate-x-full items-center pl-3 pr-1 sm:-translate-x-[60%]">
                  <button
                    type="button"
                    onClick={handleSlidePrev}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/25 hover:shadow-[0_14px_36px_rgba(0,0,0,0.32)]"
                    aria-label="Afficher l’image précédente"
                  >
                    ←
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 flex translate-x-full items-center pl-1 pr-3 sm:translate-x-[60%]">
                  <button
                    type="button"
                    onClick={handleSlideNext}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/25 hover:shadow-[0_14px_36px_rgba(0,0,0,0.32)]"
                    aria-label="Afficher l’image suivante"
                  >
                    →
                  </button>
                </div>
              </>
            )}
          </div>

          {hasBackOfficeSlideSet && (
            <div className="mt-5 flex items-center justify-center gap-3">
              {detailSlides.map((slide, idx) => {
                const isActiveSlide = idx === imageIndex;

                return (
                  <button
                    key={slide.imageUrl ?? `thumb-${idx}`}
                    type="button"
                    aria-label={`Afficher l’aperçu ${idx + 1}`}
                    onClick={() => setImageIndex(idx)}
                    className={`group relative h-16 w-16 rounded-2xl border transition duration-150 ${
                      isActiveSlide
                        ? "border-white shadow-[0_14px_36px_rgba(0,0,0,0.28)]"
                        : "border-white/40 hover:border-white/70"
                    }`}
                  >
                    {slide.imageUrl ? (
                      <div className="h-full w-full overflow-hidden rounded-2xl">
                        <img
                          src={slide.imageUrl}
                          alt=""
                          className={`h-full w-full object-cover transition-opacity duration-300 ${
                            isActiveSlide ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                        Visuel
                      </div>
                    )}
                    <span
                      className={`pointer-events-none absolute inset-0 rounded-2xl ring-2 transition ${
                        isActiveSlide ? "ring-white" : "ring-transparent group-hover:ring-white/60"
                      }`}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const showNavigation =
    !loading && !isMobile && filteredProducts.length > VISIBLE_CARDS;
  const translateX =
    showNavigation && !isMobile ? currentIndex * (CARD_WIDTH + CARD_GAP) : 0;
  const viewportWidth = useMemo(
    () =>
      isMobile
        ? undefined
        : VISIBLE_CARDS * CARD_WIDTH + CARD_GAP * (VISIBLE_CARDS - 1),
    [isMobile]
  );

  return (
    <section className="space-y-8 text-white">
      {error && (
        <div className="flex justify-center">
          <div className="rounded-full border border-red-300/50 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-100">
            {error}
          </div>
        </div>
      )}

      {!!categories.length && (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 rounded-3xl border border-white/25 bg-white/10 px-6 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">↺</span>
            <span>Filtrer par catégorie</span>
          </div>
          <div className="relative w-full max-w-lg">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/15 via-white/10 to-emerald-400/15" aria-hidden />
            <select
              value={selectedCategoryId}
              onChange={(event) => {
                setSelectedCategoryId(event.target.value);
                setCurrentIndex(0);
              }}
              className="relative z-10 w-full appearance-none rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(0,0,0,0.25)] backdrop-blur-xl transition focus:border-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {typeof category.productCount === "number"
                    ? ` (${category.productCount})`
                    : ""}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/70">▾</div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="relative">
          {showNavigation && (
            <>
              <div className="absolute inset-y-0 -left-16 flex items-center">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/25 hover:shadow-[0_14px_36px_rgba(0,0,0,0.3)] disabled:opacity-40"
                  aria-label="Afficher les logiciels précédents"
                >
                  ←
                </button>
              </div>
              <div className="absolute inset-y-0 -right-16 flex items-center">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === maxIndex}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/25 hover:shadow-[0_14px_36px_rgba(0,0,0,0.3)] disabled:opacity-40"
                  aria-label="Afficher les logiciels suivants"
                >
                  →
                </button>
              </div>
            </>
          )}

          <div
            className="mx-auto overflow-hidden overflow-y-visible pb-10"
            style={{
              maxWidth: viewportWidth,
              width: isMobile ? "100%" : viewportWidth,
            }}
          >
            <div
              className={`flex py-2 transition-transform duration-500 ease-out ${
                showNavigation
                  ? "justify-center"
                  : isMobile
                  ? "flex-col gap-4"
                  : "flex-wrap justify-center"
              }`}
              style={{
                transform: showNavigation
                  ? `translateX(-${translateX}px)`
                  : undefined,
                columnGap: showNavigation || !isMobile ? CARD_GAP : undefined,
                rowGap: !showNavigation && !isMobile ? CARD_GAP : undefined,
              }}
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
