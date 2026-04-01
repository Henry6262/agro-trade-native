import './src/i18n'; // side-effect import — must be first
import './src/styles/nativewind.setup';
import React from 'react';
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
import { NotificationBanner } from './src/shared/components/NotificationBanner';
import { ErrorBoundary } from './src/shared/components/error/ErrorBoundary';
import * as Sentry from '@sentry/react-native';

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
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  // Enable automatic session tracking
  enableAutoSessionTracking: true,
  // Enable native crash reporting
  enableNative: true,
  // Capture 100% of errors in production
  sampleRate: 1.0,
  // Set environment based on API URL
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  // Disable in development if no DSN is set
  enabled: sentryEnabled,
  // Debug mode
  debug: process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production',
  // Callback when Sentry is ready
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
  console.log('   Dashboard: https://sentry.io/organizations/agrotrade/issues/');
} else {
  console.warn('⚠️  Sentry is disabled (no DSN found)');
}

const queryClient = new QueryClient();

// Privy configuration
const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID || '';
const privyClientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID || '';

function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <SocketProvider>
              <NotificationProvider>
                <PrivyProvider appId={privyAppId} clientId={privyClientId}>
                  <StatusBar style="auto" />
                  <AppBootstrap>{(appState) => <RootNavigator appState={appState} />}</AppBootstrap>
                  <PrivyElements />
                  <NotificationBanner />
                </PrivyProvider>
              </NotificationProvider>
            </SocketProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrap App with Sentry's ErrorBoundary for React error handling
export default Sentry.wrap(App);
