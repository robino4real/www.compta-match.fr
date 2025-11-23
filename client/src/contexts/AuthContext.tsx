import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/user';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (payload: { email: string; firstName: string; lastName: string }) => void;
  logout: () => void;
}

const DEMO_USERS: Record<string, User & { password: string }> = {
  'admin@demo.fr': {
    id: 'admin-demo',
    email: 'admin@demo.fr',
    firstName: 'Admin',
    lastName: 'Démo',
    role: 'admin',
    password: 'admin123'
  },
  'client@demo.fr': {
    id: 'client-demo',
    email: 'client@demo.fr',
    firstName: 'Client',
    lastName: 'Démo',
    role: 'user',
    password: 'demo123'
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('cm_user');
    return stored ? (JSON.parse(stored) as User) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('cm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cm_user');
    }
  }, [user]);

  const login = (email: string, password: string) => {
    const account = DEMO_USERS[email];
    if (!account || account.password !== password) {
      return false;
    }
    setUser(account);
    return true;
  };

  const register = ({ email, firstName, lastName }: { email: string; firstName: string; lastName: string }) => {
    setUser({ id: `local-${Date.now()}`, email, firstName, lastName, role: 'user' });
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext introuvable');
  return ctx;
};
