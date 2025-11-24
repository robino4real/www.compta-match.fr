import React from "react";

export interface CartItem {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  type: "downloadable";
}

interface CartContextValue {
  items: CartItem[];
  addDownloadableProduct: (product: {
    id: string;
    name: string;
    priceCents: number;
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

  const addDownloadableProduct = React.useCallback(
    (product: { id: string; name: string; priceCents: number }) => {
      setItems((prev) => {
        const existing = prev.find(
          (item) => item.id === product.id && item.type === "downloadable"
        );
        // Pour un logiciel téléchargeable, on ne duplique pas : 1 licence au panier
        if (existing) {
          return prev;
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            priceCents: product.priceCents,
            quantity: 1,
            type: "downloadable",
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
      addDownloadableProduct,
      removeItem,
      clearCart,
      totalCents,
    }),
    [items, addDownloadableProduct, removeItem, clearCart, totalCents]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};
