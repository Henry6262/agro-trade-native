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
          // Update auth store with tokens and user info
          authStore.setTokens(accessToken, refreshToken);
          
          // Decode the userName properly
          const decodedUserName = userName ? decodeURIComponent(userName) : '';
          
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

          // Check if we should return to the modal
          const shouldReturnToModal = localStorage.getItem('oauth_return_to_modal') === 'true';
          const savedUserRole = localStorage.getItem('oauth_user_role');
          
          console.log('Should return to modal:', shouldReturnToModal);
          console.log('Saved user role:', savedUserRole);
          
          // Clean up localStorage
          localStorage.removeItem('oauth_return_to_modal');
          localStorage.removeItem('oauth_user_role');

          if (!hasProfile) {
            // User doesn't have a complete profile, return to onboarding with modal
            console.log('User has no profile, returning to onboarding flow...');
            
            // Load saved onboarding data
            await onboardingStore.loadOnboardingData();
            
            // Store Google auth data in onboarding store
            onboardingStore.setGoogleAuthData({
              name: decodedUserName || '',
              email: userEmail || '',
              isAuthenticated: true,
            });
            
            console.log('Google auth data set, navigating to onboarding...');
            
            // Navigate based on the user's role
            const role = savedUserRole || onboardingStore.selectedRole;
            console.log('Navigating with role:', role);
            
            if (role === 'seller') {
              console.log('Navigating to SellerOnboardingFlow...');
              navigation.navigate('Onboarding', { 
                screen: 'SellerOnboardingFlow'
              });
            } else if (role === 'buyer') {
              console.log('Navigating to BuyerOnboardingFlow...');
              navigation.navigate('Onboarding', { 
                screen: 'BuyerOnboardingFlow'
              });
            } else if (role === 'transport') {
              console.log('Navigating to TransporterOnboardingFlow...');
              navigation.navigate('Onboarding', { 
                screen: 'TransporterOnboardingFlow'
              });
            } else {
              // Fallback to role selection if no role is set
              console.log('No role found, navigating to RoleSelection...');
              navigation.navigate('Onboarding', { 
                screen: 'RoleSelection'
              });
            }
          } else if (hasProfile) {
            // User has complete profile, go to main app
            console.log('User has complete profile, navigating to dashboard...');
            navigation.navigate('Main', {
              screen: 'Dashboard'
            });
          } else {
            // No specific flow, go to role selection
            console.log('No specific flow, navigating to role selection...');
            navigation.navigate('Onboarding', {
              screen: 'RoleSelection'
            });
          }
        } else {
          // No tokens, something went wrong
          console.error('OAuth callback missing tokens');
          navigation.navigate('Onboarding', {
            screen: 'RoleSelection'
          });
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