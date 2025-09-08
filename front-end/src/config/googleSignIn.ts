import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export const configureGoogleSignIn = () => {
  // Configure Google Sign-In
  // Note: webClientId is the OAuth 2.0 Web client ID from Google Cloud Console
  GoogleSignin.configure({
    webClientId: '1008767127587-47m9aht5dh71pe8kre41hhmlogmgp9in.apps.googleusercontent.com',
    // Request offline access to get serverAuthCode for backend verification
    offlineAccess: true,
    // Request ID token for backend verification
    forceCodeForRefreshToken: true,
    // iOS specific client ID (if different from web)
    iosClientId: Platform.OS === 'ios' ? '1008767127587-47m9aht5dh71pe8kre41hhmlogmgp9in.apps.googleusercontent.com' : undefined,
    // Request these scopes
    scopes: ['profile', 'email'],
  });
};

export default configureGoogleSignIn;