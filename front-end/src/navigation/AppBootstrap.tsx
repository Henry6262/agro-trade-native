import React, { ReactNode } from 'react';
import { useAuthStore } from '@stores/auth.store';

type AppState = {
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  isReady: boolean;
};

interface AppBootstrapProps {
  children: (state: AppState) => ReactNode;
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!hasHydrated) {
    return null;
  }

  const state: AppState = {
    isAuthenticated,
    needsOnboarding: isAuthenticated && !user?.onboardingComplete,
    isReady: true,
  };

  return <>{children(state)}</>;
}

export default AppBootstrap;
