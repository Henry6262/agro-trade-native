import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../../../stores/auth.store';
import { useOnboardingStore } from '../../../stores/onboarding.store';
import { ExistingAccountModal } from '../components/ExistingAccountModal';
import { ENV } from '../../../shared/utils/environment';

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
      console.log('=== OAuth Callback Screen Mounted ===');
      console.log('Platform:', Platform.OS);
      console.log('Window location:', window?.location?.href);

      // Parse the URL parameters in web
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const hasProfile = params.get('hasProfile') === 'true';
        const userEmail = params.get('userEmail');
        const userName = params.get('userName');
        const userId = params.get('userId');

        // Log the received data
        console.log('OAuth Callback Data:', {
          hasProfile,
          userEmail,
          userName: decodeURIComponent(userName || ''),
          userId,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          tokenLength: accessToken?.length || 0,
          currentOnboardingRole: onboardingStore.selectedRole,
        });

        // Backend might only send accessToken for OAuth (refresh handled server-side)
        if (accessToken) {
          console.log('Setting tokens in auth store...');
          // Update auth store with tokens and user info
          authStore.setTokens(accessToken, refreshToken || accessToken); // Use accessToken as refresh if not provided

          // Decode the userName properly
          const decodedUserName = userName ? decodeURIComponent(userName) : '';

          console.log('Setting user in auth store:', {
            email: userEmail,
            name: decodedUserName,
            role: onboardingStore.selectedRole,
          });

          // Update auth store with user information
          if (userEmail && decodedUserName) {
            authStore.setUser({
              id: userId || '',
              email: userEmail,
              name: decodedUserName,
              role: onboardingStore.selectedRole || 'buyer',
              phone: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          // Load onboarding data to get the saved role
          await onboardingStore.loadOnboardingData();
          const savedUserRole = onboardingStore.selectedRole;

          console.log('Saved user role from store:', savedUserRole);

          // Check if user has an existing profile
          if (hasProfile && accessToken && userEmail) {
            // User has an existing account - show modal to let them choose
            console.log('Existing account detected, showing options...');

            setExistingAccountData({
              email: userEmail,
              name: decodedUserName,
              role: savedUserRole,
            });
            setShowExistingAccountModal(true);
          } else if (accessToken && userEmail && !hasProfile) {
            // New user, continue with onboarding
            console.log('New user authenticated via Google, continuing onboarding...');

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
                navigation.navigate('SellerOnboardingFlow');
                break;
              case 'buyer':
                navigation.navigate('BuyerOnboardingFlow');
                break;
              case 'transporter':
                navigation.navigate('TransporterOnboardingFlow');
                break;
              default:
                navigation.navigate('RoleSelection');
            }
          } else {
            // No tokens or error, go to role selection
            console.log('OAuth error or no tokens, navigating to role selection...');
            navigation.navigate('RoleSelection');
          }
        } else {
          // No access token, something went wrong
          console.error('OAuth callback missing access token');
          navigation.navigate('RoleSelection');
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
    console.log('User chose to login to existing profile');
    setShowExistingAccountModal(false);

    // Navigate to dashboard
    navigation.navigate('Main', {
      screen: 'Dashboard',
    });
  };

  const handleCreateNew = () => {
    // User wants to create a new profile with a different role
    console.log('User chose to create new profile');
    setShowExistingAccountModal(false);

    // Clear existing data and go to role selection
    onboardingStore.resetOnboarding();
    navigation.navigate('RoleSelection');
  };

  const handleSwitchAccount = () => {
    // User wants to use a different Google account
    console.log('User chose to switch Google account');
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
          userRole={existingAccountData.role}
          onLoginExisting={handleLoginExisting}
          onCreateNew={handleCreateNew}
          onSwitchAccount={handleSwitchAccount}
        />
      )}
    </>
  );
};
