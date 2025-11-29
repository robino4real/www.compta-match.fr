import { API_BASE_URL } from "../config/api";

interface TrackPayload {
  type: string;
  url?: string;
  referrer?: string | null;
  meta?: Record<string, unknown>;
}

export async function trackEvent(payload: TrackPayload) {
  try {
    await fetch(`${API_BASE_URL}/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'événement analytics", error);
  }
}
