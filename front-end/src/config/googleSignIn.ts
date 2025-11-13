import { GoogleSignin, GoogleSigninConfig } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

let isConfigured = false;

const buildConfig = (): GoogleSigninConfig => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

  return {
    webClientId,
    iosClientId: Platform.OS === 'ios' && iosClientId ? iosClientId : undefined,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['profile', 'email'],
  };
};

export const configureGoogleSignIn = (): void => {
  if (Platform.OS === 'web') {
    return;
  }

  if (isConfigured) {
    return;
  }

  const config = buildConfig();

  if (!config.webClientId) {
    console.warn(
      '[GoogleSignIn] Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Google authentication will be disabled until it is provided.'
    );
    return;
  }

  GoogleSignin.configure(config);
  isConfigured = true;
};

export const resetGoogleSignInConfig = () => {
  isConfigured = false;
};

export const getGoogleSignInConfig = () => buildConfig();

export default configureGoogleSignIn;
