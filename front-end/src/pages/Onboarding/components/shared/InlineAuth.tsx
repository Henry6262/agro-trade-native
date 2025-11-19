import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Animated } from 'react-native';
import { X, CheckCircle, User } from 'lucide-react-native';
import { useOnboardingStore } from '../../../../stores/onboarding.store';
import { useAuthStore } from '../../../../stores/auth.store';
import { UserRole } from '../../../../shared/types';
import { ENV } from '../../../../shared/utils/environment';

interface InlineAuthProps {
  onClose: () => void;
  onComplete: () => void;
  userRole: UserRole;
}

export const InlineAuth: React.FC<InlineAuthProps> = ({ onClose, onComplete, userRole }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);
  const checkmarkScale = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);

  const onboardingStore = useOnboardingStore();
  const { selectedRole, googleAuthData } = onboardingStore;

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

  // Check if returning from Google OAuth
  useEffect(() => {
    if (googleAuthData?.isAuthenticated) {
      console.log('User authenticated via Google:', googleAuthData);

      // Show success animation and complete
      showProfileCreatedAnimation();

      // Clear the Google auth data
      onboardingStore.setGoogleAuthData({ name: '', email: '', isAuthenticated: false });
    }
  }, [googleAuthData]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const role = userRole || selectedRole || 'buyer';

    try {
      // Use OAuth web flow for ALL platforms to ensure account selection works
      // The native SDK doesn't properly support account selection on Android
      // Adding approval_prompt=force ensures fresh consent each time
      const googleOAuthUrl = `${ENV.googleOAuthUrl}?role=${role}&prompt=select_account&access_type=online&approval_prompt=force`;

      // Store data before auth
      await onboardingStore.saveOnboardingData();
      onboardingStore.setRole(role as UserRole);

      if (Platform.OS === 'web') {
        // Web: Direct redirect
        window.location.href = googleOAuthUrl;
      } else {
        // Mobile: Open in system browser
        // This ensures proper Google account selection
        const Linking = require('react-native').Linking;

        // Show message to user
        Alert.alert(
          'Sign in with Google',
          'You will be redirected to your browser to sign in with Google. After signing in, you will be returned to the app.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false),
            },
            {
              text: 'Continue',
              onPress: async () => {
                await Linking.openURL(googleOAuthUrl);
                // The app will handle the callback when user returns
                setIsLoading(false);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Google authentication failed:', error);
      Alert.alert('Authentication Error', 'Failed to open Google sign in. Please try again.');
      setIsLoading(false);
    }
  };

  // Show profile creation animation
  if (profileCreated) {
    return (
      <View className="bg-neutral-900 rounded-lg p-6 mx-4 my-6 border border-neutral-700">
        <View className="flex-1 justify-center items-center py-12">
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
              <Text className="text-gray-500 text-sm mt-1">Setting up your dashboard...</Text>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-neutral-900 rounded-lg p-6 mx-4 my-6 border border-neutral-700">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white text-xl font-semibold">Sign In to Continue</Text>
        <TouchableOpacity onPress={onClose} className="p-2">
          <X color="#9CA3AF" size={20} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="py-4">
        <Text className="text-gray-400 text-center mb-8">
          Use your Google account for quick and secure access
        </Text>

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
    </View>
  );
};
