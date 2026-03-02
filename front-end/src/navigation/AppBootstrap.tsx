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

  // Inspectors are created by admins — they never go through onboarding
  const isInspector = user?.role === 'INSPECTOR';

  const state: AppState = {
    isAuthenticated,
    needsOnboarding: isAuthenticated && !user?.onboardingComplete && !isInspector,
    isReady: true,
  };

  return <>{children(state)}</>;
}

export default AppBootstrap;
