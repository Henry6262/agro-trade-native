import React, { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@stores/auth.store';
import { apiClient } from '@services/api';
import type { User } from '@shared/types';

type AppState = {
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  isReady: boolean;
};

interface AppBootstrapProps {
  children: (state: AppState) => ReactNode;
}

const DEV_MODE = process.env['EXPO_PUBLIC_DEV_MODE'] === 'true';

export function AppBootstrap({ children }: AppBootstrapProps) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const [devReady, setDevReady] = useState(!DEV_MODE);

  useEffect(() => {
    if (!hasHydrated || !DEV_MODE || isAuthenticated) {
      setDevReady(true);
      return;
    }

    apiClient
      .post<{ access_token: string; refresh_token: string; user: User }>(
        '/auth/dev/token',
        { role: 'ADMIN' }
      )
      .then((res) => {
        if (res.data?.access_token) {
          login(res.data.user, res.data.access_token, res.data.refresh_token);
        }
      })
      .catch((err) => console.warn('[DevMode] Auto-login failed:', err))
      .finally(() => setDevReady(true));
  }, [hasHydrated, isAuthenticated, login]);

  if (!hasHydrated || !devReady) return null;

  const isInspector = user?.role === 'INSPECTOR';

  const state: AppState = {
    isAuthenticated,
    needsOnboarding: isAuthenticated && !user?.onboardingComplete && !isInspector,
    isReady: true,
  };

  return <>{children(state)}</>;
}

export default AppBootstrap;
