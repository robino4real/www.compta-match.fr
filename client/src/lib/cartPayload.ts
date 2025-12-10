import { EnrichedCartItem } from "../hooks/useCartProducts";

export interface CartItemPayload {
  productId: string;
  quantity: number;
  binaryId?: string | null;
  platform?: string | null;
}

export const buildCartPayload = (
  items: EnrichedCartItem[]
): CartItemPayload[] => {
  return items.map((item) => ({
    productId: item.id,
    quantity: item.quantity > 0 ? item.quantity : 1,
    binaryId: item.binaryId || item.binary?.id || null,
    platform: item.platform || item.binary?.platform || null,
  }));
};
