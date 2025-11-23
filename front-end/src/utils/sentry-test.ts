/**
 * Sentry Test Utilities
 *
 * Use these functions to verify Sentry is properly configured and working.
 */

import * as Sentry from '@sentry/react-native';

/**
 * Test if Sentry is enabled and configured
 */
export const isSentryEnabled = (): boolean => {
  return !!process.env.EXPO_PUBLIC_SENTRY_DSN;
};

/**
 * Send a test error to Sentry
 * Use this to verify Sentry is capturing errors correctly
 */
export const sendTestError = () => {
  if (!isSentryEnabled()) {
    console.warn('Sentry is not enabled. Add EXPO_PUBLIC_SENTRY_DSN to your .env file');
    return;
  }

  try {
    Sentry.captureException(new Error('Test error from AgroTrade app - ignore this'));
    console.log('✅ Test error sent to Sentry successfully');
    console.log('Check your Sentry dashboard at: https://sentry.io/organizations/agrotrade/issues/');
  } catch (error) {
    console.error('❌ Failed to send test error to Sentry:', error);
  }
};

/**
 * Send a test message to Sentry
 */
export const sendTestMessage = (message: string = 'Test message from AgroTrade') => {
  if (!isSentryEnabled()) {
    console.warn('Sentry is not enabled. Add EXPO_PUBLIC_SENTRY_DSN to your .env file');
    return;
  }

  try {
    Sentry.captureMessage(message, 'info');
    console.log('✅ Test message sent to Sentry successfully');
  } catch (error) {
    console.error('❌ Failed to send test message to Sentry:', error);
  }
};

/**
 * Add custom breadcrumb for debugging
 */
export const addBreadcrumb = (message: string, category: string = 'debug', data?: any) => {
  if (!isSentryEnabled()) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (userId: string, email?: string, username?: string) => {
  if (!isSentryEnabled()) return;

  Sentry.setUser({
    id: userId,
    email,
    username,
  });
  console.log('✅ User context set in Sentry');
};

/**
 * Clear user context (e.g., on logout)
 */
export const clearUserContext = () => {
  if (!isSentryEnabled()) return;

  Sentry.setUser(null);
  console.log('✅ User context cleared in Sentry');
};

/**
 * Wrap an async function with Sentry error tracking
 * Captures any errors that occur during execution
 */
export const withSentryTracking = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T => {
  return (async (...args: any[]) => {
    addBreadcrumb(`Starting ${operationName}`, 'function');

    try {
      const result = await fn(...args);
      addBreadcrumb(`Completed ${operationName}`, 'function');
      return result;
    } catch (error) {
      addBreadcrumb(`Error in ${operationName}`, 'error', { error });
      Sentry.captureException(error);
      throw error;
    }
  }) as T;
};
