import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Platform,
  ToastAndroid,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';
import { LogIn } from 'lucide-react-native';
import { Image } from 'react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useAuthStore } from '@stores/auth.store';
import type { User } from '@shared/types';
import { AnimatedRoleCard } from './components/AnimatedRoleCard';
import { AuthGuard } from '@shared/components/AuthGuard';
import { useLoginWithOAuth, usePrivy, OAuthProviderType } from '@privy-io/expo';
import { apiClient } from '@services/api';
import { GradientBackground, GlassButton } from '@design-system';

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
  const { getAccessToken, user: privyUser } = usePrivy();
  // Use a ref so the async handler always reads the latest Privy user after OAuth resolves
  const privyUserRef = useRef(privyUser);
  privyUserRef.current = privyUser;
  const { login: loginWithOAuth, state: oauthState } = useLoginWithOAuth({});

  // Redirect to main app if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigation.getParent()?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        }) as any
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
        const { getApiUrl } = await import('@shared/utils/environment');
        const apiUrl = getApiUrl();
        window.location.href = `${apiUrl.replace('/api', '')}/api/auth/google`;
      } else {
        // If already authenticated with Privy, skip OAuth — just grab the token
        if (!privyUserRef.current) {
          await loginWithOAuth({ provider: 'google' as OAuthProviderType });
        }

        const privyToken = await getAccessToken();
        if (!privyToken) {
          throw new Error('Failed to get Privy access token');
        }

        // Extract email from Privy user (ref is updated after loginWithOAuth resolves)
        const currentPrivyUser = privyUserRef.current as Record<string, unknown>;
        const linkedAccounts = currentPrivyUser?.['linkedAccounts'] as
          | { type: string; address?: string }[]
          | undefined;
        const linkedEmail: string | undefined =
          (currentPrivyUser?.['email'] as string | undefined) ||
          linkedAccounts?.find((a) => a.type === 'google_oauth' || a.type === 'email')?.address ||
          undefined;

        const authResponse = await apiClient.post<{
          success: boolean;
          access_token: string;
          refresh_token: string;
          user: Record<string, unknown>;
        }>('/auth/privy/login', {
          privyToken,
          ...(linkedEmail ? { email: linkedEmail } : {}),
        });

        if (authResponse?.data?.access_token) {
          const { access_token, refresh_token, user: userData } = authResponse.data;
          login(userData as unknown as User, access_token, refresh_token);
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            }) as any
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
        <SafeAreaView style={styles.safeArea}>
          {/* Fixed top header — logo + brand */}
          <View style={styles.topHeader}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../../assets/agra-logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandName}>AGRO TRADE</Text>
              <Text style={styles.brandTagline}>Agricultural marketplace</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inner}>
              {/* Heading */}
              <View style={styles.headingBlock}>
                <Text style={styles.heading}>Select your role</Text>
                <Text style={styles.subheading}>Choose how you want to use the platform</Text>
              </View>

              {/* Sign In */}
              <GlassButton
                label={isPending ? 'Signing in...' : 'Sign In'}
                onPress={handleExistingUserSignIn}
                variant="secondary"
                fullWidth
                loading={isPending}
                disabled={isPending}
                leftIcon={<LogIn size={18} color="rgba(255,255,255,0.7)" />}
                style={styles.signInBtn}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CREATE NEW ACCOUNT</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Role Cards */}
              <View>
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
              <View style={styles.continueWrap}>
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
              <Text style={styles.footer}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    </AuthGuard>
  );
};

const styles = StyleSheet.create({
  brandName: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  brandTagline: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  brandText: {
    marginLeft: 12,
  },
  continueWrap: {
    marginTop: 20,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  dividerLine: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginHorizontal: 14,
  },
  footer: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 20,
    textAlign: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  headingBlock: {
    marginBottom: 28,
  },
  inner: {
    alignSelf: 'center',
    maxWidth: 600,
    width: '100%',
  },
  logoImage: {
    height: 44,
    width: 44,
  },
  logoWrapper: {
    borderRadius: 12,
    elevation: 6,
    height: 44,
    overflow: 'hidden',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    width: 44,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  signInBtn: {
    marginBottom: 24,
  },
  subheading: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  topHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
