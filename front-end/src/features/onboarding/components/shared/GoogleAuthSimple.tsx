import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Linking,
} from 'react-native';
import { CheckCircle, User } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useOnboardingStore } from '../../../../stores/onboarding.store';
import { useAuthStore } from '../../../../stores/auth.store';
import { UserRole } from '../../../../shared/types';
import { ENV } from '../../../../shared/utils/environment';

interface GoogleAuthSimpleProps {
  onComplete: () => void;
  userRole?: UserRole;
  mode?: 'inline' | 'modal';
}

export const GoogleAuthSimple: React.FC<GoogleAuthSimpleProps> = ({
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

  const { login } = useAuthStore();
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
    
    try {
      const role = userRole || selectedRole || 'buyer';
      const apiUrl = ENV.apiUrl;
      const googleOAuthUrl = `${apiUrl}/auth/google?role=${role}`;
      
      console.log('Opening Google OAuth in browser:', googleOAuthUrl);
      
      // Store onboarding data and role before opening browser
      await onboardingStore.saveOnboardingData();
      onboardingStore.setRole(role as UserRole);
      
      if (Platform.OS === 'web') {
        // For web, redirect directly
        window.location.href = googleOAuthUrl;
      } else {
        // For mobile, open in system browser
        // The user will authenticate and be redirected back to the app
        const result = await WebBrowser.openBrowserAsync(googleOAuthUrl);
        
        console.log('Browser result:', result);
        
        if (result.type === 'cancel') {
          setIsLoading(false);
        }
        
        // Note: The actual authentication completion happens when the user
        // is redirected back to the app and the OAuthCallbackScreen handles it
      }
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
        {Platform.OS !== 'web' && (
          <Text className="text-gray-500 text-xs text-center mt-2">
            You'll be redirected to your browser for secure authentication
          </Text>
        )}
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
        {/* Google Logo */}
        <View className="mr-3">
          <Text className="text-2xl">🔍</Text>
        </View>
        <Text className="text-gray-800 font-semibold text-lg">
          {isLoading ? 'Opening browser...' : 'Continue with Google'}
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