import React, { createContext, useContext, useMemo, useState } from "react";

export type WebAppType = "COMPTAPRO" | "COMPTASSO";
export type WebAppRouteType = "comptapro" | "comptasso";

export interface WebAppContextState {
  type?: WebAppRouteType;
  fiche?: { id: string; type: WebAppType; name: string } | null;
  user?: { id: string; email?: string | null } | null;
}

interface WebAppContextValue {
  context: WebAppContextState;
  setContext: (context: WebAppContextState) => void;
  resetContext: () => void;
}

const WebAppContext = createContext<WebAppContextValue | undefined>(undefined);

export const WebAppProvider: React.FC<{
  children: React.ReactNode;
  initialType?: WebAppRouteType;
}> = ({ children, initialType }) => {
  const [context, setContextState] = useState<WebAppContextState>({
    type: initialType,
    fiche: null,
    user: null,
  });

  const setContext = React.useCallback(
    (nextContext: WebAppContextState) => {
      setContextState((previous) => ({
        type: nextContext.type ?? previous.type ?? initialType,
        fiche: nextContext.fiche ?? null,
        user: nextContext.user ?? null,
      }));
    },
    [initialType]
  );

  const resetContext = React.useCallback(() => {
    setContextState({
      type: initialType,
      fiche: null,
      user: null,
    });
  }, [initialType]);

  const value = useMemo(
    () => ({
      context,
      setContext,
      resetContext,
    }),
    [context, resetContext, setContext]
  );

  return <WebAppContext.Provider value={value}>{children}</WebAppContext.Provider>;
};

export function useWebApp() {
  const context = useContext(WebAppContext);

  if (!context) {
    throw new Error("useWebApp must be used within a WebAppProvider");
  }

  return context;
}
