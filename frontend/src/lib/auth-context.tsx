"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getRoleFromCookie,
  getTenantFromCookie,
  getUserIdFromCookie,
  type LoginResponse,
} from "./api";

type AuthState = {
  userId: number | null;
  role: LoginResponse["role"] | null;
  tenant: string | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  setAuth: (data: LoginResponse) => void;
  clearAuth: () => void;
};

const EMPTY_AUTH: AuthState = { userId: null, role: null, tenant: null };

const AuthContext = createContext<AuthContextValue | null>(null);

function readAuthFromCookies(): AuthState {
  return {
    userId: getUserIdFromCookie(),
    role: getRoleFromCookie(),
    tenant: getTenantFromCookie(),
  };
}

function writeAuthCookies(data: LoginResponse): void {
  document.cookie = `token=${data.token}; path=/; max-age=86400`;
  document.cookie = `role=${data.role}; path=/; max-age=86400`;
  document.cookie = `user_id=${data.user_id}; path=/; max-age=86400`;
  document.cookie = `tenant=${data.tenant}; path=/; max-age=86400`;
}

function clearAuthCookies(): void {
  for (const name of ["token", "role", "user_id", "tenant"]) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY_AUTH);

  // Les cookies ne sont lisibles qu'au montage côté client (le rendu initial
  // côté serveur n'a pas accès à document.cookie).
  useEffect(() => {
    setState(readAuthFromCookies());
  }, []);

  const setAuth = (data: LoginResponse) => {
    writeAuthCookies(data);
    setState({ userId: data.user_id, role: data.role, tenant: data.tenant });
  };

  const clearAuth = () => {
    clearAuthCookies();
    setState(EMPTY_AUTH);
  };

  return (
    <AuthContext.Provider
      value={{ ...state, isAuthenticated: state.userId !== null, setAuth, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return ctx;
}
