import React from "react";
import { buildApiUrl } from "../config/api";
import { AuthUser } from "./AuthContext";

interface AdminAuthContextValue {
  admin: AuthUser | null;
  isLoading: boolean;
  refreshAdmin: () => Promise<void>;
  logoutAdmin: (redirectTo?: string) => Promise<void>;
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | undefined>(
  undefined
);

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({
  children,
}) => {
  const [admin, setAdmin] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshAdmin = React.useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("/auth/me"), {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const fetchedUser = (await response.json()) as AuthUser;
        if (fetchedUser.role === "admin") {
          setAdmin(fetchedUser);
          return;
        }
      }

      setAdmin(null);
    } catch (error) {
      console.error("Error refreshing admin user", error);
      setAdmin(null);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      await refreshAdmin();
      setIsLoading(false);
    })();
  }, [refreshAdmin]);

  const logoutAdmin = React.useCallback(async (redirectTo?: string) => {
    try {
      const response = await fetch(buildApiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false) {
        console.warn("Admin logout response not successful", data);
      }
    } catch (error) {
      console.error("Error during admin logout", error);
    } finally {
      setAdmin(null);
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        window.location.href = "/auth/login?admin=1";
      }
    }
  }, []);

  const value: AdminAuthContextValue = React.useMemo(
    () => ({ admin, isLoading, refreshAdmin, logoutAdmin }),
    [admin, isLoading, refreshAdmin, logoutAdmin]
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextValue => {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
