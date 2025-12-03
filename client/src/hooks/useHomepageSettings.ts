import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { HomepageResponse } from "../types/homepage";

const EMPTY_RESPONSE: HomepageResponse = {
  slug: "home",
  branding: {},
  sections: [],
  isEmpty: true,
};

export function useHomepageSettings() {
  const [data, setData] = useState<HomepageResponse>(EMPTY_RESPONSE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/public/homepage`, {
        cache: "no-store",
      });
      const json = (await response.json().catch(() => ({}))) as HomepageResponse;
      if (!response.ok) {
        throw new Error((json as any)?.message || "Impossible de charger la page d'accueil.");
      }
      setData({ ...EMPTY_RESPONSE, ...json });
    } catch (err: any) {
      console.error("Erreur de chargement de la page d'accueil", err);
      setError(err?.message || "Impossible de charger la page d'accueil.");
      setData(EMPTY_RESPONSE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {
      /* handled */
    });
  }, [load]);

  return { data, isLoading, error, reload: load };
}
