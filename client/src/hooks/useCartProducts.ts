import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { CartItem } from "../context/CartContext";
import { DownloadableProduct } from "../types/downloadableProduct";

const toCents = (priceTtc: number) => Math.round(priceTtc * 100);

export interface EnrichedCartItem extends CartItem {
  product?: DownloadableProduct;
  unitPriceCents: number;
  lineTotalCents: number;
}

export const useCartProducts = (items: CartItem[]) => {
  const [products, setProducts] = useState<DownloadableProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!items.length) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/downloadable-products/public`, {
      credentials: "include",
    })
      .then(async (response) => {
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            json?.message || "Impossible de charger les produits du panier."
          );
        }
        const incoming = Array.isArray(json?.products) ? json.products : [];
        setProducts(incoming);
      })
      .catch((err) => {
        console.error("Erreur lors du rafraîchissement du panier", err);
        setError(
          err?.message ||
            "Impossible de vérifier la disponibilité des produits du panier."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((item) => item.id).join(",")]);

  const productMap = useMemo(() => {
    return products.reduce<Record<string, DownloadableProduct>>((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }, [products]);

  const enrichedItems = useMemo<EnrichedCartItem[]>(() => {
    return items.map((item) => {
      const product = productMap[item.id];
      const unitPriceCents = product
        ? toCents(product.priceTtc)
        : item.priceCents;
      return {
        ...item,
        product,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
      };
    });
  }, [items, productMap]);

  const baseTotalCents = useMemo(
    () =>
      enrichedItems.reduce((sum, item) => {
        return sum + item.lineTotalCents;
      }, 0),
    [enrichedItems]
  );

  const missingProductIds = useMemo(() => {
    return items
      .filter((item) => !productMap[item.id])
      .map((item) => item.id);
  }, [items, productMap]);

  return {
    products,
    loading,
    error,
    enrichedItems,
    baseTotalCents,
    missingProductIds,
    refresh,
  };
};

export default useCartProducts;
