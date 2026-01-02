import React from "react";
import { DownloadPlatform } from "../types/downloadableProduct";

export interface CartItem {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  type: "downloadable";
  binaryId?: string | null;
  platform?: DownloadPlatform | null;
}

interface CartContextValue {
  items: CartItem[];
  lastAdditionTimestamp: number;
  lastAddedItemName: string | null;
  addDownloadableProduct: (product: {
    id: string;
    name: string;
    priceCents: number;
    binaryId?: string;
    platform?: DownloadPlatform;
  }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalCents: number;
}

const CartContext = React.createContext<CartContextValue | undefined>(
  undefined
);

export const useCart = (): CartContextValue => {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
};

const STORAGE_KEY = "comptamatch_cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = React.useState<CartItem[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const [lastAdditionTimestamp, setLastAdditionTimestamp] =
    React.useState<number>(0);
  const [lastAddedItemName, setLastAddedItemName] = React.useState<string | null>(
    null
  );

  const addDownloadableProduct = React.useCallback(
    (product: {
      id: string;
      name: string;
      priceCents: number;
      binaryId?: string;
      platform?: DownloadPlatform;
    }) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.id === product.id && item.type === "downloadable"
        );

        const nextTimestamp = Date.now();
        setLastAddedItemName(product.name);

        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            name: product.name,
            priceCents: product.priceCents,
            binaryId: product.binaryId ?? null,
            platform: product.platform ?? null,
          };
          setLastAdditionTimestamp(nextTimestamp);
          return updated;
        }

        setLastAdditionTimestamp(nextTimestamp);
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            priceCents: product.priceCents,
            quantity: 1,
            type: "downloadable",
            binaryId: product.binaryId ?? null,
            platform: product.platform ?? null,
          },
        ];
      });
    },
    []
  );

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const totalCents = React.useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.priceCents * item.quantity,
        0
      ),
    [items]
  );

  const value: CartContextValue = React.useMemo(
    () => ({
      items,
      lastAdditionTimestamp,
      lastAddedItemName,
      addDownloadableProduct,
      removeItem,
      clearCart,
      totalCents,
    }),
    [
      items,
      lastAdditionTimestamp,
      lastAddedItemName,
      addDownloadableProduct,
      removeItem,
      clearCart,
      totalCents,
    ]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};
