import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { CheckCircle, User } from 'lucide-react-native';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { UserRole } from '../../types';
import { APP_CONFIG } from '../../constants';

interface GoogleAuthOnlyProps {
  onComplete: () => void;
  userRole?: UserRole;
  mode?: 'inline' | 'modal';
}

export const GoogleAuthOnly: React.FC<GoogleAuthOnlyProps> = ({
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
      
      // Complete the profile automatically
      completeProfile(googleAuthData);
    }
  }, [googleAuthData]);

  const completeProfile = async (authData: any) => {
    try {
      // The user is already authenticated from Google OAuth
      // Just show the success animation
      showProfileCreatedAnimation();
      
      // Clear the Google auth data
      onboardingStore.setGoogleAuthData({ name: '', email: '', isAuthenticated: false });
    } catch (error) {
      console.error('Error completing profile:', error);
      Alert.alert('Error', 'Failed to complete profile setup');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // For Google OAuth, redirect to the backend OAuth endpoint
      const apiUrl = APP_CONFIG.API_URL;
      const role = userRole || selectedRole || 'buyer';
      const googleOAuthUrl = `${apiUrl}/auth/google?role=${role}`;
      
      if (Platform.OS === 'web') {
        // Store onboarding data and role before redirecting
        await onboardingStore.saveOnboardingData();
        onboardingStore.setRole(role as UserRole);
        
        // Redirect to Google OAuth
        window.location.href = googleOAuthUrl;
      } else {
        // For native platforms
        Alert.alert(
          'Sign in with Google', 
          'Google authentication will open in your browser. Please complete the authentication and return to the app.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false),
            },
            {
              text: 'Continue',
              onPress: async () => {
                await onboardingStore.saveOnboardingData();
                // In a real app, you'd use expo-auth-session or similar
                Alert.alert('OAuth URL', googleOAuthUrl);
                setIsLoading(false);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Google authentication failed:', error);
      Alert.alert('Authentication Error', 'Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  if (profileCreated) {
    const { width } = Dimensions.get('window');
    
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