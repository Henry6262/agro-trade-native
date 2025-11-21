import { Platform } from 'react-native';

// Declare __DEV__ for TypeScript
declare const __DEV__: boolean;

/**
 * Get the current application URL based on the platform and environment
 */
export const getAppUrl = (): string => {
  if (Platform.OS === 'web') {
    // For web, use the current origin
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
  }

  // For mobile apps or fallback
  return process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:8081';
};

/**
 * Get the API URL based on environment
 */
export const getApiUrl = (): string => {
  // For Android emulator, use special IP to access host
  if (Platform.OS === 'android' && __DEV__) {
    return 'http://10.0.2.2:4000/api';
  }

  // Use configured API URL if available
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // For web platform in production
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;

    // If we're on a production domain
    if (host !== 'localhost' && !host.includes('127.0.0.1')) {
      // Check if we have an explicit production API URL
      if (process.env.EXPO_PUBLIC_API_URL_PRODUCTION) {
        return process.env.EXPO_PUBLIC_API_URL_PRODUCTION;
      }

      // Assume the API is hosted on a similar domain with 'api' subdomain
      // or '-api' suffix for Vercel deployments
      const protocol = window.location.protocol;

      // Check common patterns
      if (host.includes('vercel.app')) {
        // For Vercel deployments, the backend might be on a different subdomain
        const appName = host.split('.')[0];
        return `${protocol}//${appName}-api.vercel.app/api`;
      } else {
        // For custom domains, try api subdomain
        return `${protocol}//api.${host}/api`;
      }
    }
  }

  // Default to localhost for development
  return 'http://localhost:4000/api';
};

/**
 * Get OAuth redirect URL
 */
export const getOAuthRedirectUrl = (): string => {
  const appUrl = getAppUrl();
  return `${appUrl}/auth/callback`;
};

/**
 * Get Google OAuth URL with proper redirect
 */
export const getGoogleOAuthUrl = (): string => {
  const apiUrl = getApiUrl();

  // The backend will handle the redirect URL based on its environment
  return `${apiUrl}/auth/google`;
};

/**
 * Check if we're in production environment
 */
export const isProduction = (): boolean => {
  if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production') {
    return true;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    return host !== 'localhost' && !host.includes('127.0.0.1');
  }

  return false;
};

/**
 * Environment configuration
 */
export const ENV = {
  get apiUrl() {
    return getApiUrl();
  },
  get appUrl() {
    return getAppUrl();
  },
  get googleOAuthUrl() {
    return getGoogleOAuthUrl();
  },
  get isProduction() {
    return isProduction();
  },
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'AgroTrade',
  appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
};
