import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  isEmailVerified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const refreshUser = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement de l'utilisateur", error);
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      await refreshUser();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const logout = React.useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
    } finally {
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = React.useMemo(
    () => ({
      user,
      isLoading,
      refreshUser,
      logout,
    }),
    [user, isLoading, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
