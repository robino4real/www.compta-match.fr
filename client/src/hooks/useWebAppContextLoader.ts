import React from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { useWebApp, WebAppRouteType, WebAppType } from "../context/WebAppContext";

interface FicheContextResponse {
  ok: boolean;
  fiche: { id: string; type: WebAppType; name: string };
  user: { id: string; email?: string | null };
}

interface UseWebAppContextLoaderOptions {
  expectedType: WebAppType;
  routeType: WebAppRouteType;
  ficheId?: string;
}

export function useWebAppContextLoader({
  expectedType,
  routeType,
  ficheId: ficheIdOverride,
}: UseWebAppContextLoaderOptions) {
  const { ficheId: routeFicheId } = useParams<{ ficheId: string }>();
  const ficheId = ficheIdOverride ?? routeFicheId;
  const { context, setContext } = useWebApp();

  const hasCachedContext =
    context.type === routeType &&
    context.fiche?.id === ficheId &&
    context.fiche?.type === expectedType &&
    Boolean(context.user);

  const [isLoading, setIsLoading] = React.useState(!hasCachedContext);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadContext = async () => {
      if (!ficheId) {
        if (!isMounted) return;
        setError("Identifiant de fiche manquant.");
        setIsLoading(false);
        setContext({ type: routeType, fiche: null, user: null });
        return;
      }

      if (hasCachedContext) {
        if (!isMounted) return;
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!isMounted) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/app/fiche/${ficheId}/context`, {
          credentials: "include",
        });
        const data = (await response.json()) as FicheContextResponse & { message?: string };

        if (!response.ok) {
          const message =
            response.status === 403
              ? "Accès interdit"
              : response.status === 404
              ? "Fiche introuvable"
              : data?.message || "Impossible de charger le contexte de la fiche.";
          throw new Error(message);
        }

        if (data.fiche.type !== expectedType) {
          throw new Error("Fiche introuvable");
        }

        if (!isMounted) return;

        setContext({ type: routeType, fiche: data.fiche, user: data.user });
        setError(null);
      } catch (fetchError) {
        if (!isMounted) return;
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Impossible de charger le contexte de la fiche.";
        setError(message);
        setContext({ type: routeType, fiche: null, user: null });
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    loadContext();

    return () => {
      isMounted = false;
    };
  }, [expectedType, ficheId, hasCachedContext, routeType, setContext]);

  const hasContext = hasCachedContext || (!isLoading && !error && Boolean(context.fiche && context.user));

  return { ficheId, isLoading, error, hasContext };
}
