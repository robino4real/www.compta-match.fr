import { API_BASE_URL } from "../config/api";
import { EnrichedCartItem } from "../hooks/useCartProducts";
import { apiFetch } from "../lib/api";
import { buildCartPayload } from "../lib/cartPayload";

interface ApplyPromoResponse {
  ok: boolean;
  code: string;
  discountAmount: number;
  newTotal: number;
  message?: string;
}

interface RemovePromoResponse {
  ok: boolean;
  discountAmount: number;
  newTotal: number;
  message?: string;
}

export async function applyPromoCode(
  code: string,
  items: EnrichedCartItem[]
): Promise<ApplyPromoResponse> {
  return apiFetch<ApplyPromoResponse>(`${API_BASE_URL}/cart/apply-promo`, {
    method: "POST",
    body: JSON.stringify({
      code: code.trim(),
      items: buildCartPayload(items),
    }),
  });
}

export async function removePromoCode(
  items: EnrichedCartItem[]
): Promise<RemovePromoResponse> {
  return apiFetch<RemovePromoResponse>(`${API_BASE_URL}/cart/remove-promo`, {
    method: "POST",
    body: JSON.stringify({
      items: buildCartPayload(items),
    }),
  });
}
