import React, { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../../navigation/types';
import { BuyerOnboarding } from '@pages/Onboarding/sections/Buyer/components/BuyerOnboarding';
import { useOnboardingStore } from '@stores/onboarding.store';

type BuyerOnboardingFlowScreenNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'BuyerOnboardingFlow'
>;

interface Props {
  navigation: BuyerOnboardingFlowScreenNavigationProp;
  route: any;
}

export const BuyerOnboardingFlowScreen: React.FC<Props> = ({ navigation }) => {
  const onboardingStore = useOnboardingStore();

  useEffect(() => {
    // Set user role to buyer when entering this flow
    onboardingStore.setRole('buyer');

    // Save onboarding data when component mounts
    onboardingStore.saveOnboardingData?.().catch(console.error);
  }, []);

  const handleComplete = () => {
    // Authentication happens inside BuyerOnboarding via the drawer
    // Navigate to completion screen after successful auth
    navigation.navigate('OnboardingComplete');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <BuyerOnboarding onComplete={handleComplete} />
    </View>
  );
};
