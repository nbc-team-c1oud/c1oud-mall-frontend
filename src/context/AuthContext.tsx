import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { fetchMe, login as loginApi } from "../api/auth";
import { ApiError, tokenStore } from "../api/client";
import type { UserResponse } from "../api/types";

interface AuthState {
  user: UserResponse | null;
  status: "loading" | "guest" | "authed";
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  const refresh = useCallback(async () => {
    const token = tokenStore.get();
    if (!token) {
      setUser(null);
      setStatus("guest");
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
      setStatus("authed");
    } catch (e) {
      if (e instanceof ApiError && [401, 403].includes(e.status)) {
        tokenStore.clear();
      }
      setUser(null);
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken } = await loginApi({ email, password });
      tokenStore.set(accessToken);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, status, login, logout, refresh }),
    [user, status, login, logout, refresh],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
