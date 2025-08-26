import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { authStore } from './src/store/authStore';
import './src/styles/global.css';

const queryClient = new QueryClient();

export default function App() {
  const [appState, setAppState] = useState({
    isAuthenticated: false,
    needsOnboarding: false,
    isReady: false,
  });

  useEffect(() => {
    // Initialize auth state
    const checkAuthState = async () => {
      try {
        await authStore.loadStoredData();
        const isAuthenticated = authStore.isAuthenticated();
        const user = authStore.user;
        
        setAppState({
          isAuthenticated,
          needsOnboarding: isAuthenticated && (!user?.onboardingCompleted),
          isReady: true,
        });
      } catch (error) {
        console.error('Error loading auth state:', error);
        setAppState({
          isAuthenticated: false,
          needsOnboarding: false,
          isReady: true,
        });
      }
    };

    checkAuthState();
  }, []);

  if (!appState.isReady) {
    // You could return a splash screen here
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <RootNavigator appState={appState} />
    </QueryClientProvider>
  );
}