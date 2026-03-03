import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../../navigation/types';
import { SellerOnboarding } from '@pages/Onboarding/sections/Seller/components/SellerOnboarding';
import { useOnboardingStore } from '@stores/onboarding.store';
import { GradientBackground } from '../../../../design-system';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'SellerOnboardingFlow'>;

interface Props {
  navigation: NavigationProp;
  route: any;
}

export const SellerOnboardingFlowScreen: React.FC<Props> = ({ navigation }) => {
  const onboardingStore = useOnboardingStore();

  useEffect(() => {
    // Set user role to seller when entering this flow
    onboardingStore.setRole('seller');

    // Save onboarding data when component mounts
    onboardingStore.saveOnboardingData?.().catch(console.error);
  }, []);

  const handleComplete = () => {
    // Authentication happens inside SellerOnboarding via the drawer
    // Navigate to completion screen after successful auth
    navigation.navigate('OnboardingComplete' as never);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <SellerOnboarding onComplete={handleComplete} />
      </SafeAreaView>
    </GradientBackground>
  );
};
