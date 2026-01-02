import { API_BASE_URL } from "../config/api";

export interface UserAccessEligibility {
  hasActiveSubscription: boolean;
  hasAnyFiche: boolean;
}

async function safeJson<T>(response: Response): Promise<T | Record<string, never>> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    console.warn("Impossible de parser la réponse d'éligibilité", error);
    return {};
  }
}

export async function fetchUserAccessEligibility(): Promise<UserAccessEligibility> {
  const [subscriptionsRes, proFichesRes, assoFichesRes] = await Promise.all([
    fetch(`${API_BASE_URL}/account/subscriptions`, { credentials: "include" }),
    fetch(`${API_BASE_URL}/app/fiches?type=COMPTAPRO`, { credentials: "include" }),
    fetch(`${API_BASE_URL}/app/fiches?type=COMPTASSO`, { credentials: "include" }),
  ]);

  const subscriptionsData = subscriptionsRes.ok ? await safeJson<{ subscriptions?: unknown[] }>(subscriptionsRes) : {};
  const proFichesData = proFichesRes.ok ? await safeJson<{ fiches?: unknown[] }>(proFichesRes) : {};
  const assoFichesData = assoFichesRes.ok ? await safeJson<{ fiches?: unknown[] }>(assoFichesRes) : {};

  const hasActiveSubscription = Array.isArray(subscriptionsData.subscriptions)
    ? subscriptionsData.subscriptions.length > 0
    : false;

  const proFichesCount = Array.isArray(proFichesData.fiches) ? proFichesData.fiches.length : 0;
  const assoFichesCount = Array.isArray(assoFichesData.fiches) ? assoFichesData.fiches.length : 0;

  return {
    hasActiveSubscription,
    hasAnyFiche: proFichesCount + assoFichesCount > 0,
  };
}
