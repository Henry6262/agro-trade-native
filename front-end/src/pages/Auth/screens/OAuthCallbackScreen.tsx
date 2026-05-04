import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useAuthStore } from '@stores/auth.store';
import { useOnboardingStore } from '@stores/onboarding.store';
import { ExistingAccountModal } from '../components/ExistingAccountModal';
import { ENV } from '../../../shared/utils/environment';
import { UserRole } from '../../../shared/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const OAuthCallbackScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const authStore = useAuthStore();
  const onboardingStore = useOnboardingStore();
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [existingAccountData, setExistingAccountData] = useState<{
    email: string;
    name: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Parse the URL parameters in web
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const hasProfile = params.get('hasProfile') === 'true';
        const userEmail = params.get('userEmail');
        const userName = params.get('userName');
        const userId = params.get('userId');

        // Backend might only send accessToken for OAuth (refresh handled server-side)
        if (accessToken) {
          // Update auth store with tokens and user info
          authStore.setTokens(accessToken, refreshToken || accessToken); // Use accessToken as refresh if not provided

          // Decode the userName properly
          const decodedUserName = userName ? decodeURIComponent(userName) : '';

          // Update auth store with user information
          if (userEmail && decodedUserName) {
            authStore.setUser({
              id: userId || '',
              email: userEmail,
              name: decodedUserName,
              role: (onboardingStore.selectedRole || 'buyer') as unknown as UserRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          // Load onboarding data to get the saved role
          await onboardingStore.loadOnboardingData();
          const savedUserRole = onboardingStore.selectedRole;

          // Check if user has an existing profile
          if (hasProfile && accessToken && userEmail) {
            // User has an existing account - show modal to let them choose
            setExistingAccountData({
              email: userEmail,
              name: decodedUserName,
              ...(savedUserRole ? { role: savedUserRole } : {}),
            });
            setShowExistingAccountModal(true);
          } else if (accessToken && userEmail && !hasProfile) {
            // New user, continue with onboarding
            // Store success flag for showing animation
            onboardingStore.setGoogleAuthData({
              name: decodedUserName || '',
              email: userEmail || '',
              isAuthenticated: true,
            });

            // Navigate back to the onboarding flow they came from
            const role = savedUserRole || 'buyer';
            switch (role) {
              case 'seller':
                navigation.navigate('Onboarding', { screen: 'SellerOnboardingFlow' });
                break;
              case 'buyer':
                navigation.navigate('Onboarding', { screen: 'BuyerOnboardingFlow' });
                break;
              case 'transport':
                navigation.navigate('Onboarding', { screen: 'TransporterOnboardingFlow' });
                break;
              default:
                navigation.navigate('Onboarding', { screen: 'RoleSelection' });
            }
          } else {
            // No tokens or error, go to role selection
            navigation.navigate('Onboarding', { screen: 'RoleSelection' });
          }
        } else {
          // No access token, something went wrong
          console.error('OAuth callback missing access token');
          navigation.navigate('Onboarding', { screen: 'RoleSelection' });
        }
      }
    };

    // Add a small delay to ensure everything is loaded
    setTimeout(() => {
      handleOAuthCallback();
    }, 100);
  }, []); // Remove dependencies to avoid re-running

  const handleLoginExisting = () => {
    // User wants to login to their existing profile
    setShowExistingAccountModal(false);

    // Navigate to dashboard - Main IS the DashboardStack
    navigation.navigate('Main', {
      screen: 'DashboardMain',
      params: {},
    });
  };

  const handleCreateNew = () => {
    // User wants to create a new profile with a different role
    setShowExistingAccountModal(false);

    // Clear existing data and go to role selection
    onboardingStore.resetOnboarding();
    navigation.navigate('Onboarding', { screen: 'RoleSelection' });
  };

  const handleSwitchAccount = () => {
    // User wants to use a different Google account
    setShowExistingAccountModal(false);

    // Sign out and redirect to Google OAuth with account selection
    authStore.logout();
    const googleOAuthUrl = `${ENV.googleOAuthUrl}?prompt=select_account`;

    if (Platform.OS === 'web') {
      window.location.href = googleOAuthUrl;
    }
  };

  return (
    <>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>
          Completing authentication...
        </Text>
      </View>

      {existingAccountData && (
        <ExistingAccountModal
          visible={showExistingAccountModal}
          userEmail={existingAccountData.email}
          userName={existingAccountData.name}
          {...(existingAccountData.role ? { userRole: existingAccountData.role } : {})}
          onLoginExisting={handleLoginExisting}
          onCreateNew={handleCreateNew}
          onSwitchAccount={handleSwitchAccount}
        />
      )}
    </>
  );
};
