import React, { useState, useEffect } from 'react';
import { View, StatusBar, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../navigation/types';
import { BuyerOnboarding } from '../../components/buyer/BuyerOnboarding';
import { AuthModal } from '../../components/shared/AuthModal';
import { useOnboardingStore } from '../../../../stores/onboarding.store';

type BuyerOnboardingFlowScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BuyerOnboardingFlow'
>;

interface Props {
  navigation: BuyerOnboardingFlowScreenNavigationProp;
  route: any;
}

export const BuyerOnboardingFlowScreen: React.FC<Props> = ({ navigation }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const onboardingStore = useOnboardingStore();

  useEffect(() => {
    // Set user role to buyer when entering this flow
    onboardingStore.setRole('buyer');
    
    // Save onboarding data when component mounts
    onboardingStore.saveOnboardingData?.().catch(console.error);
    
    // Check if we're returning from Google OAuth
    const googleAuthData = onboardingStore.googleAuthData;
    if (googleAuthData?.isAuthenticated) {
      console.log('Returning from Google OAuth, showing modal with pre-filled data');
      // Show the auth modal with the second step (business details)
      setShowAuthModal(true);
    }
  }, []);

  const handleComplete = async () => {
    try {
      // Save current onboarding data before showing auth modal
      await onboardingStore.saveOnboardingData?.();
      // Show authentication modal instead of directly navigating
      setShowAuthModal(true);
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      // Still show auth modal even if save fails
      setShowAuthModal(true);
    }
  };

  const handleAuthComplete = () => {
    setShowAuthModal(false);
    navigation.navigate('OnboardingComplete');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <BuyerOnboarding onComplete={handleComplete} />
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onComplete={handleAuthComplete}
        userRole="buyer"
      />
    </View>
  );
};