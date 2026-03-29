"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/app/stores/auth.store";
import { apiClient } from "@/app/lib/api";
import type { User } from "@/app/types";

/**
 * Bridges Privy authentication with the NestJS backend.
 *
 * Flow:
 *  1. User logs in via Privy (email, wallet, or social)
 *  2. Privy issues a JWT (getAccessToken())
 *  3. We send that JWT to POST /auth/verify-token
 *  4. Backend verifies via Privy JWKS, returns our User object
 *  5. We store user + token in Zustand (persisted to localStorage)
 */
export function useAuth() {
  // Always call usePrivy at the top level (Rules of Hooks)
  // PrivyProvider is mounted after hydration in layout, so this is safe for client components
  const privy = usePrivy();

  const privyReady = privy.ready;
  const privyAuthenticated = privy.authenticated;
  const privyUser = privy.user;
  const privyLogin = privy.login;
  const privyLogout = privy.logout;
  const privyGetAccessToken = privy.getAccessToken;

  const { user, token, isAuthenticated, isLoading, error, login, logout, setLoading, setError } = useAuthStore();
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!privyReady || !privyAuthenticated || !privyUser || hasVerified.current) return;
    if (isAuthenticated && token) return;

    const verifyWithBackend = async () => {
      try {
        setLoading(true);
        const accessToken = await privyGetAccessToken();
        if (!accessToken) throw new Error("No access token from Privy");

        const res = await apiClient.post<{ user: User; accessToken: string }>(
          "/auth/verify-token",
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const data = res as unknown as { user: User; accessToken: string };
        login(data.user, data.accessToken || accessToken);
        hasVerified.current = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        setError(msg);
        console.error("Backend auth verification failed:", err);
      }
    };

    verifyWithBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privyReady, privyAuthenticated, privyUser, isAuthenticated, token]);

  const handleLogin = useCallback(() => {
    privyLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privyLogin]);

  const handleLogout = useCallback(async () => {
    try {
      await privyLogout();
    } catch {
      // Privy logout may fail if already logged out
    }
    logout();
    hasVerified.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privyLogout, logout]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || !privyReady,
    error,
    login: handleLogin,
    logout: handleLogout,
    ready: privyReady,
    privyAuthenticated,
  };
}
