import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Platform, ToastAndroid, SafeAreaView } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { LogIn } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useAuthStore } from '@stores/auth.store';
import { AnimatedRoleCard } from '../components/AnimatedRoleCard';
import { AuthGuard } from '@shared/components/AuthGuard';
import { useLoginWithOAuth, usePrivy, OAuthProviderType } from '@privy-io/expo';
import { apiClient } from '@services/api';
import { GradientBackground, GlassButton, GlassBadge } from '../../../design-system';

const ROLE_IMAGES = {
  buyer: require('../../../../assets/UserTypes/Buyer.png'),
  seller: require('../../../../assets/UserTypes/Seller.png'),
  transport: require('../../../../assets/UserTypes/transporter.png'),
} as const;

type RoleSelectionScreenNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'RoleSelection'
>;

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RoleSelectionScreenNavigationProp>();
  const { setRole } = useOnboardingStore();
  const { isAuthenticated, user, login } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | 'transport' | null>(null);

  // Privy hooks
  const { getAccessToken } = usePrivy();
  const { login: loginWithOAuth, state: oauthState } = useLoginWithOAuth({});

  // Redirect to main app if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigation.getParent()?.dispatch(
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
      color: '#60A5FA',
      gradient: ['#3B82F6', '#1E40AF'],
      imageSource: ROLE_IMAGES.buyer,
    },
    {
      id: 'seller' as const,
      title: 'Seller',
      color: '#4ADE80',
      gradient: ['#10B981', '#065F46'],
      imageSource: ROLE_IMAGES.seller,
    },
    {
      id: 'transport' as const,
      title: 'Transporter',
      color: '#A78BFA',
      gradient: ['#8B5CF6', '#5B21B6'],
      imageSource: ROLE_IMAGES.transport,
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
        const { getApiUrl } = await import('@shared/utils/environment');
        const apiUrl = getApiUrl();
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
      <GradientBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 48,
              paddingHorizontal: 24,
              paddingBottom: 32,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
              {/* Header */}
              <View style={{ marginBottom: 40, alignItems: 'center' }}>
                <GlassBadge
                  label="AgroTrade"
                  variant="success"
                  size="md"
                  style={{ marginBottom: 20 }}
                />
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  I am a...
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.65)',
                    textAlign: 'center',
                  }}
                >
                  Choose your role to get started
                </Text>
              </View>

              {/* Sign In Button for Existing Users */}
              <GlassButton
                label={isPending ? 'Signing in...' : 'Sign In'}
                onPress={handleExistingUserSignIn}
                variant="secondary"
                fullWidth
                loading={isPending}
                disabled={isPending}
                leftIcon={<LogIn size={20} color="rgba(255,255,255,0.65)" />}
                style={{ marginBottom: 28 }}
              />

              {/* Divider */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                  }}
                />
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.35)',
                    marginHorizontal: 16,
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                  }}
                >
                  OR CREATE NEW ACCOUNT
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                  }}
                />
              </View>

              {/* Role Cards */}
              <View style={{ gap: 0 }}>
                {roleCards.map((card, index) => (
                  <AnimatedRoleCard
                    key={card.id}
                    id={card.id}
                    title={card.title}
                    color={card.color}
                    gradient={card.gradient}
                    imageSource={card.imageSource}
                    isSelected={selectedRole === card.id}
                    onPress={() => handleRoleSelect(card.id)}
                    delay={index * 100}
                  />
                ))}
              </View>

              {/* Continue Button */}
              <View style={{ marginTop: 20 }}>
                <GlassButton
                  label="Continue"
                  onPress={() => selectedRole && handleRoleSelect(selectedRole)}
                  variant="primary"
                  fullWidth
                  disabled={!selectedRole}
                  size="lg"
                />
              </View>

              {/* Footer */}
              <Text
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 24,
                  lineHeight: 18,
                }}
              >
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    </AuthGuard>
  );
};
