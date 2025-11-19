import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useOnboardingStore } from '../../../../stores/onboarding.store';
import { useAuthStore } from '../../../../stores/auth.store';
import { authService } from '../../../../services/authService';
import { UserRole } from '../../../../shared/types';
import { ENV } from '../../../../shared/utils/environment';
import configureGoogleSignIn from '../../../../config/googleSignIn';

interface NativeGoogleAuthProps {
  onClose: () => void;
  onComplete: () => void;
  userRole: UserRole;
}

export const NativeGoogleAuth: React.FC<NativeGoogleAuthProps> = ({
  onClose,
  onComplete,
  userRole,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const onboardingStore = useOnboardingStore();
  const { selectedRole } = onboardingStore;

  useEffect(() => {
    // Configure Google Sign-In when component mounts
    configureGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      // First, sign out any existing Google session to force account selection
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore errors from sign out
        console.log('No previous session to sign out');
      }

      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Sign in with account selection
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const userInfo = response.data;
        console.log('Google Sign-In successful:', userInfo);

        // Now send the Google token to your backend
        const role = userRole || selectedRole || 'buyer';

        // Get the ID token to send to backend
        const tokens = await GoogleSignin.getTokens();

        // Send to your backend for verification and user creation
        const backendResponse = await authService.googleSignIn({
          idToken: tokens.idToken,
          role: role,
          email: userInfo.user.email,
          name: userInfo.user.name,
          googleId: userInfo.user.id,
          photo: userInfo.user.photo,
        });

        // Store auth data
        if (backendResponse.user && backendResponse.accessToken) {
          await login(
            backendResponse.user,
            backendResponse.accessToken,
            backendResponse.refreshToken
          );

          // Store onboarding completion
          onboardingStore.setGoogleAuthData({
            name: userInfo.user.name || '',
            email: userInfo.user.email || '',
            isAuthenticated: true,
          });

          onComplete();
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled the sign-in flow
            console.log('Sign in cancelled');
            break;
          case statusCodes.IN_PROGRESS:
            // Sign in already in progress
            console.log('Sign in already in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              'Google Play Services',
              'Google Play Services are not available or outdated. Please update them to continue.'
            );
            break;
          default:
            Alert.alert('Sign In Error', 'An error occurred during sign in. Please try again.');
        }
      } else {
        Alert.alert(
          'Authentication Error',
          error.message || 'Failed to sign in with Google. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // For web platform, fall back to OAuth redirect
  if (Platform.OS === 'web') {
    const handleWebGoogleSignIn = async () => {
      setIsLoading(true);
      try {
        const role = userRole || selectedRole || 'buyer';
        // Force account selection with prompt parameter
        const googleOAuthUrl = `${ENV.googleOAuthUrl}?role=${role}&prompt=select_account`;

        await onboardingStore.saveOnboardingData();
        onboardingStore.setRole(role as UserRole);

        // Add a small delay to ensure state is saved
        setTimeout(() => {
          window.location.href = googleOAuthUrl;
        }, 100);
      } catch (error) {
        console.error('Google authentication failed:', error);
        Alert.alert('Authentication Error', 'Failed to sign in with Google. Please try again.');
        setIsLoading(false);
      }
    };

    return (
      <View className="bg-neutral-900 rounded-lg p-6 mx-4 my-6 border border-neutral-700">
        <View className="items-center">
          <Text className="text-white text-xl font-semibold mb-6">Sign In to Continue</Text>

          <TouchableOpacity
            onPress={handleWebGoogleSignIn}
            disabled={isLoading}
            className="bg-white rounded-lg px-6 py-3 flex-row items-center justify-center w-full"
          >
            {isLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <View className="w-5 h-5 mr-3">
                  <Text style={{ fontSize: 18 }}>🔷</Text>
                </View>
                <Text className="text-gray-700 font-medium">Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Native implementation for mobile
  return (
    <View className="bg-neutral-900 rounded-lg p-6 mx-4 my-6 border border-neutral-700">
      <View className="items-center">
        <Text className="text-white text-xl font-semibold mb-6">Sign In to Continue</Text>

        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          className="bg-white rounded-lg px-6 py-3 flex-row items-center justify-center w-full"
        >
          {isLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <View className="w-5 h-5 mr-3">
                <Text style={{ fontSize: 18 }}>🔷</Text>
              </View>
              <Text className="text-gray-700 font-medium">Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-neutral-400 text-xs mt-4 text-center">
          You'll be able to choose which Google account to use
        </Text>
      </View>
    </View>
  );
};
