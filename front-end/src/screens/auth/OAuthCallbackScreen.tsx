import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const OAuthCallbackScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const authStore = useAuthStore();
  const onboardingStore = useOnboardingStore();

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
          hasTokens: !!(accessToken && refreshToken),
          currentOnboardingRole: onboardingStore.selectedRole,
        });

        if (accessToken && refreshToken) {
          console.log('Setting tokens in auth store...');
          // Update auth store with tokens and user info
          authStore.setTokens(accessToken, refreshToken);
          
          // Decode the userName properly
          const decodedUserName = userName ? decodeURIComponent(userName) : '';
          
          console.log('Setting user in auth store:', {
            email: userEmail,
            name: decodedUserName,
            role: onboardingStore.selectedRole
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

          // Since we're removing business profile completion, treat all authenticated users as having a complete profile
          if (accessToken && userEmail) {
            // User is authenticated, go directly to dashboard
            console.log('User authenticated via Google, navigating to dashboard...');
            
            // Store success flag for showing animation
            onboardingStore.setGoogleAuthData({
              name: decodedUserName || '',
              email: userEmail || '',
              isAuthenticated: true,
            });
            
            // Navigate to a success screen or directly to dashboard
            // The success animation will show on the dashboard
            navigation.navigate('Main', {
              screen: 'Dashboard'
            });
          } else if (!hasProfile && false) { // Disabled old flow
            // User has complete profile, go to main app
            console.log('User has complete profile, navigating to dashboard...');
            navigation.navigate('Main', {
              screen: 'Dashboard'
            });
          } else {
            // No specific flow, go to role selection
            console.log('No specific flow, navigating to role selection...');
            navigation.navigate('RoleSelection');
          }
        } else {
          // No tokens, something went wrong
          console.error('OAuth callback missing tokens');
          navigation.navigate('RoleSelection');
        }
      }
    };

    // Add a small delay to ensure everything is loaded
    setTimeout(() => {
      handleOAuthCallback();
    }, 100);
  }, []); // Remove dependencies to avoid re-running

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <ActivityIndicator size="large" color="#22C55E" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>
        Completing authentication...
      </Text>
    </View>
  );
};