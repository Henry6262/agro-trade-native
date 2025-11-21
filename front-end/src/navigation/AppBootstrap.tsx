import React, { useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@stores/auth.store';
import configureGoogleSignIn from '../config/googleSignIn';

type AppState = {
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  isReady: boolean;
};

interface AppBootstrapProps {
  children: (state: AppState) => ReactNode;
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    needsOnboarding: false,
    isReady: false,
  });

  useEffect(() => {
    try {
      configureGoogleSignIn();
    } catch (error) {
      console.warn('Failed to configure Google Sign-In', error);
    }

    const initAuthState = async () => {
      try {
        const authState = useAuthStore.getState();
        const isAuthenticated = authState.isAuthenticated;
        const user = authState.user;

        setState({
          isAuthenticated,
          needsOnboarding: isAuthenticated && !user?.onboardingComplete,
          isReady: true,
        });
      } catch (error) {
        setState({ isAuthenticated: false, needsOnboarding: false, isReady: true });
      }
    };

    initAuthState();
  }, []);

  if (!state.isReady) {
    return null;
  }

  return <>{children(state)}</>;
}

export default AppBootstrap;
