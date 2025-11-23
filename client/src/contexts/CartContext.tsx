import React, { createContext, useContext, useMemo, useState } from 'react';
import { Product } from '../types/product';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.product.id !== id));

  const total = useMemo(() => items.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [items]);

  return <CartContext.Provider value={{ items, addItem, removeItem, total }}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('CartContext introuvable');
  return ctx;
};
