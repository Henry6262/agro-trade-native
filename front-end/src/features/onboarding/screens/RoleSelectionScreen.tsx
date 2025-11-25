import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { LogIn } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useAuthStore } from '@stores/auth.store';
import { AnimatedRoleCard } from '../components/AnimatedRoleCard';
import { AuthGuard } from '@shared/components/AuthGuard';
import { useLoginWithOAuth, usePrivy, OAuthProviderType } from '@privy-io/expo';
import { apiClient } from '@services/api';

type RoleSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RoleSelection'
>;

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RoleSelectionScreenNavigationProp>();
  const { setRole } = useOnboardingStore();
  const { setTokens, setUser, isAuthenticated, user, login } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | 'transport' | null>(null);

  // Privy hooks
  const { getAccessToken } = usePrivy();
  const { login: loginWithOAuth, state: oauthState } = useLoginWithOAuth({});

  // Redirect to main app if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    }
  }, [isAuthenticated, user, navigation]);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Notice', message);
    }
  };

  const roleCards = [
    {
      id: 'buyer' as const,
      title: 'Buyer',
      color: '#3B82F6',
      gradient: ['#3B82F6', '#1E40AF'],
    },
    {
      id: 'seller' as const,
      title: 'Seller',
      color: '#10B981',
      gradient: ['#10B981', '#065F46'],
    },
    {
      id: 'transport' as const,
      title: 'Transporter',
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#5B21B6'],
    },
  ];

  const handleRoleSelect = (role: 'buyer' | 'seller' | 'transport') => {
    setRole(role);
    setSelectedRole(role);

    // Navigate to the appropriate onboarding flow
    setTimeout(() => {
      switch (role) {
        case 'buyer':
          navigation.navigate('BuyerOnboardingFlow');
          break;
        case 'seller':
          navigation.navigate('SellerOnboardingFlow');
          break;
        case 'transport':
          navigation.navigate('TransporterOnboardingFlow');
          break;
      }
    }, 200);
  };

  const handleExistingUserSignIn = async () => {
    setIsSigningIn(true);

    try {
      if (Platform.OS === 'web') {
        // Web platform - use redirect OAuth
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
        window.location.href = `${apiUrl.replace('/api', '')}/api/auth/google`;
      } else {
        // Mobile platform - use Privy OAuth
        await loginWithOAuth({ provider: 'google' as OAuthProviderType });

        // Get Privy access token
        const privyToken = await getAccessToken();
        if (!privyToken) {
          throw new Error('Failed to get Privy access token');
        }

        // Send to backend for authentication (no role for existing users)
        const authResponse = await apiClient.post<{
          success: boolean;
          access_token: string;
          refresh_token: string;
          user: any;
        }>('/auth/privy/login', {
          privyToken,
        });

        if (authResponse?.data?.access_token) {
          const { access_token, refresh_token, user: userData } = authResponse.data;

          // Store auth data
          login(userData, access_token, refresh_token);

          // Navigate to main app
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        } else {
          showToast('Authentication failed. Please try again.');
        }
      }
    } catch (error: unknown) {
      console.error('Privy authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to sign in. ${errorMessage}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const isPending = isSigningIn || oauthState.status === 'loading';

  return (
    <AuthGuard requireAuth={false} redirectTo="Main">
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
            {/* Header - Simplified with just logo */}
            <View style={{ marginBottom: 48, alignItems: 'center' }}>
              <LinearGradient
                colors={['#3B82F6', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 42,
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                  }}
                >
                  AgroTrade
                </Text>
              </LinearGradient>
            </View>

            {/* Sign In Button for Existing Users - More prominent */}
            <TouchableOpacity
              onPress={handleExistingUserSignIn}
              disabled={isPending}
              style={{
                marginBottom: 32,
                opacity: isPending ? 0.7 : 1,
              }}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <LogIn size={24} color="white" style={{ marginRight: 12 }} />
                <Text
                  style={{
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  {isPending ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 32,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: 'rgba(148, 163, 184, 0.2)',
                }}
              />
              <Text
                style={{
                  color: '#94A3B8',
                  marginHorizontal: 16,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                OR CREATE NEW ACCOUNT
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: 'rgba(148, 163, 184, 0.2)',
                }}
              />
            </View>

            {/* Role Cards - Compact with Animated Icons */}
            <View>
              {roleCards.map((card, index) => (
                <AnimatedRoleCard
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  color={card.color}
                  gradient={card.gradient}
                  isSelected={selectedRole === card.id}
                  onPress={() => handleRoleSelect(card.id)}
                  delay={index * 100}
                />
              ))}
            </View>

            {/* Footer */}
            <Text
              style={{
                color: '#64748B',
                fontSize: 12,
                textAlign: 'center',
                marginTop: 32,
                lineHeight: 18,
              }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </View>
    </AuthGuard>
  );
};
