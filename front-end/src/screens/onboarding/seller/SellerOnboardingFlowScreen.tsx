import React, { useState, useEffect } from 'react';
import { View, StatusBar, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../navigation/types';
import { SellerOnboarding } from '../../../components/onboarding';
import { InlineAuth } from '../../../components/onboarding/shared/InlineAuth';
import { useOnboardingStore } from '../../../store/onboardingStore';

type NavigationProp = StackNavigationProp<RootStackParamList, 'SellerOnboardingFlow'>;

interface Props {
  navigation: NavigationProp;
  route: any;
}

export const SellerOnboardingFlowScreen: React.FC<Props> = ({ navigation }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const onboardingStore = useOnboardingStore();

  useEffect(() => {
    // Set user role to seller when entering this flow
    onboardingStore.setRole('seller');
    
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

  if (showAuthModal) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827' }}>
        <StatusBar barStyle="light-content" backgroundColor="#111827" />
        <ScrollView style={{ flex: 1 }}>
          <InlineAuth
            onClose={() => setShowAuthModal(false)}
            onComplete={handleAuthComplete}
            userRole="seller"
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <SellerOnboarding onComplete={handleComplete} />
    </View>
  );
};