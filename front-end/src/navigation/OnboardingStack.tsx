import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';

// Import onboarding screens
import { RoleSelectionScreen } from '../features/onboarding/screens/RoleSelectionScreen';
import { PathSelectScreen } from '../features/onboarding/screens/PathSelectScreen';
import { BuyerOnboardingFlowScreen } from '../features/onboarding/screens/buyer/BuyerOnboardingFlowScreen';
import { SellerOnboardingFlowScreen } from '../features/onboarding/screens/seller/SellerOnboardingFlowScreen';
import { TransporterOnboardingFlowScreen } from '../features/onboarding/screens/transporter/TransporterOnboardingFlowScreen';
import { OnboardingCompleteScreen } from '../features/onboarding/screens/OnboardingCompleteScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="PathSelect" component={PathSelectScreen} />
      <Stack.Screen name="BuyerOnboardingFlow" component={BuyerOnboardingFlowScreen} />
      <Stack.Screen name="SellerOnboardingFlow" component={SellerOnboardingFlowScreen} />
      <Stack.Screen name="TransporterOnboardingFlow" component={TransporterOnboardingFlowScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
}
