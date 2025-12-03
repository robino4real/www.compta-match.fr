import { EnrichedCartItem } from "../hooks/useCartProducts";

export interface CartItemPayload {
  productId: string;
  quantity: number;
}

export const buildCartPayload = (
  items: EnrichedCartItem[]
): CartItemPayload[] => {
  return items.map((item) => ({
    productId: item.id,
    quantity: item.quantity > 0 ? item.quantity : 1,
  }));
};
