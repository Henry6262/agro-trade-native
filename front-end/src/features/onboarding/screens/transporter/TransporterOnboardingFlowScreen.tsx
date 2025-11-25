import React, { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../navigation/types';
import { TransporterOnboarding } from '@pages/Onboarding/sections/Transporter/components/TransporterOnboarding';
import { useOnboardingStore } from '@stores/onboarding.store';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TransporterOnboardingFlow'>;

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
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TransporterOnboarding onComplete={handleComplete} />
    </View>
  );
};
