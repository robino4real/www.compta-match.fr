import React from "react";
import { useParams } from "react-router-dom";
import { useWebApp, WebAppRouteType, WebAppType } from "../context/WebAppContext";
import { WebAppApiError, webAppFetch } from "../lib/webAppFetch";

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
  const [error, setError] = React.useState<WebAppApiError | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadContext = async () => {
      if (!ficheId) {
        if (!isMounted) return;
        setError(new WebAppApiError("Ressource introuvable", 404, "NOT_FOUND"));
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
        const data = await webAppFetch<FicheContextResponse>(
          `/api/app/${routeType}/fiche/${ficheId}/context`
        );

        if (data.fiche.type !== expectedType) {
          throw new WebAppApiError("Ressource introuvable", 404, "NOT_FOUND");
        }

        if (!isMounted) return;

        setContext({ type: routeType, fiche: data.fiche, user: data.user });
        setError(null);
      } catch (fetchError) {
        if (!isMounted) return;
        const appError =
          fetchError instanceof WebAppApiError
            ? fetchError
            : new WebAppApiError("Impossible de charger le contexte de la fiche.");
        setError(appError);
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
