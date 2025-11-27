import { useEffect, useState } from "react";
import { CustomPageResponse } from "../types/pageBuilder";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function useCustomPage(route: string) {
  const [data, setData] = useState<CustomPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `${API_BASE_URL}/api/public/pages/by-route?route=${encodeURIComponent(route)}`
        );

        if (!isMounted) return;

        if (response.status === 404) {
          setData(null);
          setError(null);
          return;
        }

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(json?.message || "Impossible de charger la page personnalisée.");
        }

        setData(json as CustomPageResponse);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Erreur de chargement de page personnalisée", err);
        setError(err?.message || "Impossible de charger la page personnalisée.");
        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPage();

    return () => {
      isMounted = false;
    };
  }, [route]);

  return { data, isLoading, error };
}
