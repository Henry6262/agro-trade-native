import './src/styles/nativewind.setup';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AppBootstrap } from './src/navigation/AppBootstrap';
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
      console.log('📤 Sentry capturing event:', event.message || event.exception?.values?.[0]?.type);
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

function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <AppBootstrap>{(appState) => <RootNavigator appState={appState} />}</AppBootstrap>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Wrap App with Sentry's ErrorBoundary for React error handling
export default Sentry.wrap(App);
