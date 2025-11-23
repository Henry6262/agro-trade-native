import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useLoginWithOAuth, usePrivy, OAuthProviderType } from '@privy-io/expo';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useAuthStore } from '@stores/auth.store';
import { UserRole } from '../../../../shared/types';
import { apiClient } from '@services/api';

interface PrivyAuthNativeProps {
  onComplete: () => void;
  userRole?: UserRole;
  mode?: 'inline' | 'modal';
}

export const PrivyAuthNative: React.FC<PrivyAuthNativeProps> = ({
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
  const { selectedRole } = onboardingStore;
  const { user, getAccessToken } = usePrivy();

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
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation completes, wait a bit then complete
      setTimeout(() => {
        onComplete();
      }, 1000);
    });
  };

  const handlePrivyLoginSuccess = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get Privy access token
      const privyToken = await getAccessToken();
      if (!privyToken) {
        throw new Error('Failed to get Privy access token');
      }

      // Send Privy token to backend for verification and app token generation
      const roleToUse = userRole || selectedRole;
      const response = await apiClient.post('/auth/privy/login', {
        privyToken,
        role: roleToUse,
        email: user?.email?.address,
        name: user?.google?.name || user?.apple?.name || user?.twitter?.name,
      });

      if (response.data.access_token) {
        // Store tokens and login
        await login(
          response.data.access_token,
          response.data.refresh_token,
          response.data.user
        );

        // Show success animation
        showProfileCreatedAnimation();
      } else {
        throw new Error('No access token received from backend');
      }
    } catch (error: any) {
      console.error('Privy login error:', error);
      setIsLoading(false);
      Alert.alert(
        'Authentication Failed',
        error.response?.data?.message || error.message || 'Please try again later.'
      );
    }
  }, [user, userRole, selectedRole, getAccessToken, login, onComplete]);

  const handlePrivyLoginError = useCallback((error: any) => {
    console.error('Privy OAuth error:', error);
    setIsLoading(false);
    Alert.alert(
      'Sign in Failed',
      'Unable to complete sign in. Please try again.'
    );
  }, []);

  const { login: loginWithGoogle, state: oauthState } = useLoginWithOAuth({
    onLoginSuccess: handlePrivyLoginSuccess,
    onError: handlePrivyLoginError,
  });

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle({ provider: 'google' as OAuthProviderType });
    } catch (error) {
      console.error('Error initiating Google sign in:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to initiate Google sign in');
    }
  };

  // Profile created success UI
  if (profileCreated) {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
          paddingVertical: 48,
          paddingHorizontal: 24,
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#22C55E',
        }}
      >
        <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
          <CheckCircle size={64} color="#22C55E" />
        </Animated.View>

        <Animated.Text
          style={{
            opacity: textOpacity,
            color: '#22C55E',
            fontSize: 24,
            fontWeight: 'bold',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Profile Created!
        </Animated.Text>

        <Animated.Text
          style={{
            opacity: textOpacity,
            color: '#9CA3AF',
            fontSize: 16,
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          Redirecting you now...
        </Animated.Text>
      </Animated.View>
    );
  }

  // Sign in UI
  return (
    <View style={mode === 'inline' ? { marginTop: 24 } : { padding: 20 }}>
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={isLoading || oauthState.status === 'initial-loading'}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          opacity: isLoading || oauthState.status === 'initial-loading' ? 0.6 : 1,
        }}
        activeOpacity={0.8}
      >
        {isLoading || oauthState.status === 'initial-loading' ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <>
            <Text style={{ fontSize: 18, marginRight: 12 }}>🔐</Text>
            <Text
              style={{
                color: '#1F2937',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text
        style={{
          color: '#9CA3AF',
          fontSize: 12,
          textAlign: 'center',
          marginTop: 16,
          paddingHorizontal: 24,
        }}
      >
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
};
