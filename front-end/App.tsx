import './src/styles/nativewind.setup';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/auth.store';
import configureGoogleSignIn from './src/config/googleSignIn';

const queryClient = new QueryClient();

export default function App() {
  const [appState, setAppState] = useState({
    isAuthenticated: false,
    needsOnboarding: false,
    isReady: false,
  });

  useEffect(() => {
    // Configure Google Sign-In on app start (mobile only)
    if (Platform.OS !== 'web') {
      try {
        configureGoogleSignIn();
      } catch (error) {
        console.error('Failed to configure Google Sign-In:', error);
      }
    }
    
    // DEV ONLY: Set authentication for testing
    if (__DEV__) {
      const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWY5c3B1eXAwMDAwNW5xc3B3cmJ3ZWVyIiwiaWF0IjoxNzU3NjEwNzY5LCJleHAiOjE3NTgyMTU1Njl9.L-Y6NnLz_amguhs9PcwURUws2AgQciTzScGu9ungpig';
      const devUser = {
        id: 'cmf9spuyp00005nqspwrbweer',
        email: 'enriquemiloslavov10@gmail.com',
        name: 'Estoica chondo',
        role: 'BUYER',
        onboardingComplete: true,
      };
      useAuthStore.setState({
        token: devToken,
        user: devUser,
        isAuthenticated: true,
      });
      console.log('DEV: Auth set for testing');
    }
    
    // Initialize auth state
    const checkAuthState = async () => {
      try {
        // The auth store automatically loads from AsyncStorage via persist middleware
        const authState = useAuthStore.getState();
        const isAuthenticated = authState.isAuthenticated;
        const user = authState.user;
        
        setAppState({
          isAuthenticated,
          needsOnboarding: isAuthenticated && (!user?.onboardingComplete),
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