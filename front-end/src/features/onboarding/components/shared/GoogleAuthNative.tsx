import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle, User } from 'lucide-react-native';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useOnboardingStore } from '../../../../stores/onboarding.store';
import { useAuthStore } from '../../../../stores/auth.store';
import { UserRole } from '../../../../shared/types';
import { ENV } from '../../../../shared/utils/environment';
import { apiClient } from '../../../../services/api';

interface GoogleAuthNativeProps {
  onComplete: () => void;
  userRole?: UserRole;
  mode?: 'inline' | 'modal';
}

export const GoogleAuthNative: React.FC<GoogleAuthNativeProps> = ({
  onComplete,
  userRole,
  mode = 'inline',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);
  const checkmarkScale = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);

  const { setTokens, setUser } = useAuthStore();
  const onboardingStore = useOnboardingStore();
  const { selectedRole } = onboardingStore;

  // Handle successful profile creation animation
  const showProfileCreatedAnimation = () => {
    setProfileCreated(true);
    
    // Start animations in sequence
    Animated.sequence([
      // Fade in and scale up the container
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Scale up checkmark
      Animated.spring(checkmarkScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      // Fade in success text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Wait a moment then complete
      setTimeout(() => {
        onComplete();
      }, 1500);
    });
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      // For web, redirect to backend OAuth
      handleWebSignIn();
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in with Google
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        const { data: userInfo } = response;
        console.log('Google Sign-In successful:', userInfo.user.email);
        
        // Get the ID token for backend verification
        const { idToken } = await GoogleSignin.getTokens();
        
        // Send the ID token to our backend for verification and JWT creation
        await authenticateWithBackend(idToken, userInfo);
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled the sign-in flow
            console.log('User cancelled sign-in');
            break;
          case statusCodes.IN_PROGRESS:
            // Sign-in already in progress
            console.log('Sign-in already in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              'Google Play Services Required',
              'Google Play Services is not available or outdated. Please update it from the Play Store.'
            );
            break;
          default:
            Alert.alert('Sign-In Error', 'An error occurred during sign-in. Please try again.');
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithBackend = async (idToken: string, userInfo: any) => {
    try {
      const role = userRole || selectedRole || 'buyer';
      
      // Send the ID token to our backend
      const response = await apiClient.post<{
        success: boolean;
        access_token: string;
        user: any;
      }>('/auth/google/native', {
        idToken,
        role,
        userInfo: {
          id: userInfo.user.id,
          email: userInfo.user.email,
          name: userInfo.user.name,
          givenName: userInfo.user.givenName,
          familyName: userInfo.user.familyName,
          photo: userInfo.user.photo,
        },
      });

      console.log('Backend response:', response);

      if (response?.data?.success) {
        const { access_token, user } = response.data;
        
        // Store tokens and user info
        setTokens(access_token, access_token);
        setUser(user);
        
        // Show success animation
        showProfileCreatedAnimation();
      }
    } catch (error: any) {
      console.error('Backend authentication failed:', error);
      Alert.alert(
        'Authentication Error',
        error.response?.data?.message || 'Failed to complete authentication with our servers'
      );
      
      // Sign out from Google if backend auth fails
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        console.error('Failed to sign out:', signOutError);
      }
    }
  };

  const handleWebSignIn = async () => {
    setIsLoading(true);
    
    try {
      const role = userRole || selectedRole || 'buyer';
      const apiUrl = ENV.apiUrl;
      const googleOAuthUrl = `${apiUrl}/auth/google?role=${role}`;
      
      // Store onboarding data and role before redirecting
      await onboardingStore.saveOnboardingData();
      onboardingStore.setRole(role as UserRole);
      
      // Redirect to Google OAuth
      window.location.href = googleOAuthUrl;
    } catch (error: any) {
      console.error('Google authentication failed:', error);
      Alert.alert('Authentication Error', 'Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  if (profileCreated) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
          }}
          className="bg-gray-800 rounded-2xl p-8 border border-gray-700"
        >
          {/* Profile Avatar with Checkmark */}
          <View className="relative mb-6">
            <View className="w-24 h-24 bg-gray-700 rounded-full items-center justify-center">
              <User size={48} color="#10b981" />
            </View>
            <Animated.View
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                transform: [{ scale: checkmarkScale }],
              }}
            >
              <View className="bg-emerald-500 rounded-full p-1">
                <CheckCircle size={32} color="white" strokeWidth={3} />
              </View>
            </Animated.View>
          </View>

          {/* Success Message */}
          <Animated.View style={{ opacity: textOpacity }} className="items-center">
            <Text className="text-2xl font-bold text-white mb-2">
              Profile Created!
            </Text>
            <Text className="text-gray-400 text-center">
              Welcome to AgroTrade
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Redirecting to dashboard...
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className={`${mode === 'modal' ? 'bg-gray-800 rounded-xl p-6 m-4' : 'p-6'}`}>
      {/* Header */}
      <View className="mb-8 items-center">
        <Text className="text-3xl font-bold text-white mb-2">
          Welcome to AgroTrade
        </Text>
        <Text className="text-gray-400 text-center">
          Sign in with your Google account to continue
        </Text>
      </View>

      {/* Google Sign In Button */}
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={isLoading}
        className="bg-white rounded-xl p-4 flex-row items-center justify-center mb-6"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#4B5563" />
        ) : (
          <>
            {/* Google Logo */}
            <View className="mr-3">
              <Text className="text-2xl">🔍</Text>
            </View>
            <Text className="text-gray-800 font-semibold text-lg">
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Security Note */}
      <View className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <Text className="text-gray-400 text-sm text-center">
          🔒 Secure authentication powered by Google
        </Text>
        <Text className="text-gray-500 text-xs text-center mt-1">
          We never store your Google password
        </Text>
      </View>

      {/* Terms */}
      <Text className="text-gray-500 text-xs text-center mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
};