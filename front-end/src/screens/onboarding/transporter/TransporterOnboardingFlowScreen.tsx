import React, { useState, useEffect } from 'react';
import { View, StatusBar, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../navigation/types';
import { TransporterOnboarding } from '../../../components/onboarding';
import { AuthModal } from '../../../components/onboarding/shared/AuthModal';
import { useOnboardingStore } from '../../../store/onboardingStore';

type NavigationProp = StackNavigationProp<RootStackParamList, 'TransporterOnboardingFlow'>;

interface Props {
  navigation: NavigationProp;
  route: any;
}

export const TransporterOnboardingFlowScreen: React.FC<Props> = ({ navigation }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const onboardingStore = useOnboardingStore();

  useEffect(() => {
    // Set user role to transporter when entering this flow
    onboardingStore.setRole('transport');
    
    // Save onboarding data when component mounts
    onboardingStore.saveOnboardingData?.().catch(console.error);
    
    // Check if we're returning from OAuth
    const googleAuthData = onboardingStore.googleAuthData;
    if (googleAuthData?.isAuthenticated) {
      console.log('Returning from OAuth, showing modal with pre-filled data');
      setShowAuthModal(true);
    }
  }, []);

  const handleComplete = async () => {
    try {
      // Save current onboarding data before showing auth modal
      await onboardingStore.saveOnboardingData?.();
      setShowAuthModal(true);
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
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
      <TransporterOnboarding onComplete={handleComplete} />
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onComplete={handleAuthComplete}
        userRole="transport"
      />
    </View>
  );
};