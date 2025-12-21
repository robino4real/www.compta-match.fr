import React from "react";
import { buildApiUrl } from "../config/api";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  isEmailVerified?: boolean;
  profile?: {
    accountType?: "INDIVIDUAL" | "PROFESSIONAL" | "ASSOCIATION";
    companyName?: string | null;
    vatNumber?: string | null;
    siret?: string | null;
    billingStreet?: string | null;
    billingZip?: string | null;
    billingCity?: string | null;
    billingCountry?: string | null;
    phone?: string | null;
  };
}

interface ClientAuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  register: (
    payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      accountType: "INDIVIDUAL" | "PROFESSIONAL" | "ASSOCIATION";
      address1: string;
      address2?: string;
      postalCode: string;
      city: string;
      country: string;
      companyName?: string;
      vatNumber?: string;
      siret?: string;
      phone?: string;
    }
  ) => Promise<{ success: boolean; message?: string }>;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    user?: AuthUser;
    message?: string;
    status?: string;
    twoFactorToken?: string;
  }>;
  logout: (redirectTo?: string) => Promise<void>;
}

const ClientAuthContext = React.createContext<ClientAuthContextValue | undefined>(
  undefined
);

interface ClientAuthProviderProps {
  children: React.ReactNode;
}

export const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshUser = React.useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("/auth/me"), {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const fetchedUser = (await response.json()) as AuthUser;
        if (fetchedUser.role === "admin") {
          setUser(null);
          return;
        }

        setUser(fetchedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user", error);
      setUser(null);
    }
  }, []);

  const register = React.useCallback(
    async (payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      accountType: "INDIVIDUAL" | "PROFESSIONAL" | "ASSOCIATION";
      address1: string;
      address2?: string;
      postalCode: string;
      city: string;
      country: string;
      companyName?: string;
      vatNumber?: string;
      siret?: string;
      phone?: string;
    }): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      try {
        const response = await fetch(buildApiUrl("/auth/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data?.user) {
          setUser(data.user as AuthUser);
          return { success: true };
        }

        return {
          success: false,
          message: data?.message || "Impossible de créer le compte.",
        };
      } catch (error) {
        console.error("Error during registration", error);
        return {
          success: false,
          message: "Impossible de traiter la demande d'inscription.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const login = React.useCallback(
    async (
      email: string,
      password: string
    ): Promise<{
      success: boolean;
      user?: AuthUser;
      message?: string;
      status?: string;
      twoFactorToken?: string;
    }> => {
      setIsLoading(true);
      try {
        const response = await fetch(buildApiUrl("/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (data?.status === "OTP_REQUIRED") {
          return {
            success: false,
            status: data.status,
            message:
              data?.message ||
              "Connexion sécurisée requise. Merci de saisir le code reçu par email.",
            twoFactorToken: data.twoFactorToken,
          };
        }

        if (response.ok && data?.user) {
          setUser(data.user as AuthUser);
          return { success: true, user: data.user as AuthUser };
        }

        return {
          success: false,
          message: data?.message || "Email ou mot de passe incorrect.",
        };
      } catch (error) {
        console.error("Error during login", error);
        return {
          success: false,
          message: "Impossible de traiter la requête. Merci de réessayer.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    (async () => {
      await refreshUser();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const logout = React.useCallback(async (redirectTo?: string) => {
    try {
      const response = await fetch(buildApiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        console.warn("Logout response not successful", data);
      }
    } catch (error) {
      console.error("Error during logout", error);
    } finally {
      setUser(null);
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        window.location.href = "/";
      }
    }
  }, []);

  const value: ClientAuthContextValue = React.useMemo(
    () => ({ user, isLoading, refreshUser, register, login, logout }),
    [user, isLoading, refreshUser, register, login, logout]
  );

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = (): ClientAuthContextValue => {
  const context = React.useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth must be used within a ClientAuthProvider");
  }
  return context;
};

// Backward compatibility exports
export const AuthProvider = ClientAuthProvider;
export const useAuth = useClientAuth;
