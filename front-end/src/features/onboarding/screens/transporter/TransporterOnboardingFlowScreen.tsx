import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../../navigation/types';
import { TransporterOnboarding } from '@pages/Onboarding/sections/Transporter/components/TransporterOnboarding';
import { useOnboardingStore } from '@stores/onboarding.store';
import { GradientBackground } from '../../../../design-system';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'TransporterOnboardingFlow'
>;

interface Props {
  navigation: NavigationProp;
  route: any;
}

export const TransporterOnboardingFlowScreen: React.FC<Props> = ({ navigation }) => {
  const onboardingStore = useOnboardingStore();

  useEffect(() => {
    // Set user role to transporter when entering this flow
    onboardingStore.setRole('transport');

    // Save onboarding data when component mounts
    onboardingStore.saveOnboardingData?.().catch(console.error);
  }, []);

  const handleComplete = () => {
    // Authentication happens inside TransporterOnboarding via the drawer
    // Navigate to completion screen after successful auth
    navigation.navigate('OnboardingComplete');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <TransporterOnboarding onComplete={handleComplete} />
      </SafeAreaView>
    </GradientBackground>
  );
};
