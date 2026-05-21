import './src/i18n'; // side-effect import — must be first
import './src/styles/global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PrivyProvider } from '@privy-io/expo';
import { PrivyElements } from '@privy-io/expo/ui';
import RootNavigator from './src/navigation/RootNavigator';
import { AppBootstrap } from './src/navigation/AppBootstrap';
import { SocketProvider } from './src/providers/SocketProvider';
import { NotificationProvider } from './src/providers/NotificationProvider';
import * as Sentry from '@sentry/react-native';
import { initI18n } from './src/i18n';

// Initialize Sentry
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const sentryEnabled = !!sentryDsn;

if (sentryEnabled) {
  console.log('🔍 Sentry initializing...');
  console.log('   Environment:', process.env.EXPO_PUBLIC_ENVIRONMENT || 'development');
  console.log('   DSN configured:', sentryDsn ? '✅ Yes' : '❌ No');
}

Sentry.init({
  dsn: sentryDsn,
  tracesSampleRate: 1.0,
  enableAutoSessionTracking: true,
  enableNative: true,
  sampleRate: 1.0,
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  enabled: sentryEnabled,
  debug: process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production',
  beforeSend(event) {
    if (process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production') {
      console.log(
        '📤 Sentry capturing event:',
        event.message || event.exception?.values?.[0]?.type
      );
    }
    return event;
  },
});

if (sentryEnabled) {
  console.log('✅ Sentry initialized successfully');
} else {
  console.warn('⚠️  Sentry is disabled (no DSN found)');
}

const queryClient = new QueryClient();

// Privy configuration
const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID || '';
const privyClientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID || '';

function App() {
  useEffect(() => {
    // Load saved language on startup
    initI18n().catch((err: Error) => {
      console.error('Failed to initialize i18n:', err);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <NotificationProvider>
              <PrivyProvider appId={privyAppId} clientId={privyClientId}>
                <StatusBar style="auto" />
                <AppBootstrap>{(appState) => <RootNavigator appState={appState} />}</AppBootstrap>
                <PrivyElements />
              </PrivyProvider>
            </NotificationProvider>
          </SocketProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
