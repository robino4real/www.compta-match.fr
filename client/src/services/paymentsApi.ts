import { API_BASE_URL } from "../config/api";
import { EnrichedCartItem } from "../hooks/useCartProducts";
import { apiFetch } from "../lib/api";
import { buildCartPayload } from "../lib/cartPayload";

interface BillingFormState {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  vatNumber: string;
}

interface CheckoutSessionResponse {
  url: string;
  message?: string;
}

interface DownloadConfirmationResponse {
  order: {
    id: string;
    paidAt: string;
    currency: string;
    totalPaid: number;
    firstProductName?: string;
  };
  orderDownloadToken?: string;
  download: { token: string; productName?: string } | null;
  message?: string;
  status?: string;
}

export interface OrderStatusResponse {
  status: string;
  order?: {
    id: string;
    paidAt?: string | null;
    currency?: string;
    totalPaid?: number;
    firstProductName?: string;
  };
  orderDownloadToken?: string | null;
  download?: { token: string; productName?: string } | null;
  message?: string;
}

export async function createDownloadCheckoutSession(options: {
  items: EnrichedCartItem[];
  promoCode?: string;
  billing: BillingFormState;
  acceptedTerms: boolean;
  acceptedLicense: boolean;
}): Promise<CheckoutSessionResponse> {
  return apiFetch<CheckoutSessionResponse>(
    `${API_BASE_URL}/payments/downloads/checkout-session`,
    {
      method: "POST",
      body: JSON.stringify({
        items: buildCartPayload(options.items),
        promoCode: options.promoCode,
        billing: options.billing,
        acceptedTerms: options.acceptedTerms,
        acceptedLicense: options.acceptedLicense,
      }),
    }
  );
}

export async function fetchOrderStatusBySession(
  sessionId: string,
  signal?: AbortSignal
): Promise<OrderStatusResponse> {
  return apiFetch<OrderStatusResponse>(
    `${API_BASE_URL}/orders/by-session/${sessionId}`,
    { method: "GET", signal }
  );
}

export async function fetchDownloadConfirmation(
  params: { sessionId?: string; orderId?: string },
  signal?: AbortSignal
): Promise<DownloadConfirmationResponse> {
  const searchParams = new URLSearchParams();
  if (params.sessionId) {
    searchParams.set("session_id", params.sessionId);
  }
  if (params.orderId) {
    searchParams.set("order_id", params.orderId);
  }

  return apiFetch<DownloadConfirmationResponse>(
    `${API_BASE_URL}/payments/downloads/confirmation?${searchParams.toString()}`,
    {
      method: "GET",
      signal,
      skipDefaultJsonHeaders: true,
    }
  );
}
