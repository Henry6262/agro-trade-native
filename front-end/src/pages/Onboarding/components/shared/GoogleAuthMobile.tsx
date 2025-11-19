import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Animated } from 'react-native';
import { CheckCircle, User } from 'lucide-react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useOnboardingStore } from '../../../../stores/onboarding.store';
import { useAuthStore } from '../../../../stores/auth.store';
import { UserRole } from '../../../../shared/types';
import { ENV } from '../../../../shared/utils/environment';
import { apiClient } from '../../../../services/api';

// This ensures the web browser closes properly after auth
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthMobileProps {
  onComplete: () => void;
  userRole?: UserRole;
  mode?: 'inline' | 'modal';
}

export const GoogleAuthMobile: React.FC<GoogleAuthMobileProps> = ({
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

  const { login, setTokens, setUser } = useAuthStore();
  const onboardingStore = useOnboardingStore();
  const { selectedRole } = onboardingStore;

  // Configure the auth request
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  // Create the auth request
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '1008767127587-47m9aht5dh71pe8kre41hhmlogmgp9in.apps.googleusercontent.com',
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'agrotrade',
        path: 'auth',
      }),
    },
    discovery
  );

  // Handle the auth response
  useEffect(() => {
    if (response?.type === 'success' && response.params?.code) {
      handleAuthCode(response.params.code);
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
      Alert.alert('Authentication Error', 'Failed to authenticate with Google');
      setIsLoading(false);
    }
  }, [response]);

  const handleAuthCode = async (code: string) => {
    try {
      setIsLoading(true);

      // Exchange the auth code for tokens with our backend
      const role = userRole || selectedRole || 'buyer';
      const apiUrl = ENV.apiUrl;

      const response = await apiClient.post('/auth/google/mobile', {
        code,
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'agrotrade',
          path: 'auth',
        }),
        role,
      });

      if (response.data.success) {
        const { access_token, user } = response.data;

        // Store tokens and user info
        setTokens(access_token, access_token);
        setUser(user);

        // Show success animation
        showProfileCreatedAnimation();
      }
    } catch (error: any) {
      console.error('Failed to exchange auth code:', error);
      Alert.alert(
        'Authentication Error',
        error.response?.data?.message || 'Failed to complete authentication'
      );
      setIsLoading(false);
    }
  };

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
      // For web, use the traditional OAuth flow
      handleWebSignIn();
    } else {
      // For mobile, use the auth session
      setIsLoading(true);
      await promptAsync();
    }
  };

  const handleWebSignIn = async () => {
    setIsLoading(true);

    try {
      const role = userRole || selectedRole || 'buyer';
      const apiUrl = ENV.apiUrl;
      // Add prompt=select_account to force account selection
      const googleOAuthUrl = `${apiUrl}/auth/google?role=${role}&prompt=select_account`;

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
            <Text className="text-2xl font-bold text-white mb-2">Profile Created!</Text>
            <Text className="text-gray-400 text-center">Welcome to AgroTrade</Text>
            <Text className="text-gray-500 text-sm mt-1">Redirecting to dashboard...</Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className={`${mode === 'modal' ? 'bg-gray-800 rounded-xl p-6 m-4' : 'p-6'}`}>
      {/* Header */}
      <View className="mb-8 items-center">
        <Text className="text-3xl font-bold text-white mb-2">Welcome to AgroTrade</Text>
        <Text className="text-gray-400 text-center">
          Sign in with your Google account to continue
        </Text>
      </View>

      {/* Google Sign In Button */}
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={isLoading || !request}
        className="bg-white rounded-xl p-4 flex-row items-center justify-center mb-6"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {/* Google Logo */}
        <View className="mr-3">
          <Text className="text-2xl">🔍</Text>
        </View>
        <Text className="text-gray-800 font-semibold text-lg">
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Text>
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
