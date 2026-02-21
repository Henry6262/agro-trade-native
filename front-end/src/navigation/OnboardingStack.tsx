import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';

// Import onboarding screens
import { RoleSelectionScreen } from '../pages/Onboarding/screens/RoleSelectionScreen';
import { BuyerOnboardingFlowScreen } from '../pages/Onboarding/screens/buyer/BuyerOnboardingFlowScreen';
import { SellerOnboardingFlowScreen } from '../pages/Onboarding/screens/seller/SellerOnboardingFlowScreen';
import { TransporterOnboardingFlowScreen } from '../pages/Onboarding/screens/transporter/TransporterOnboardingFlowScreen';
import { OnboardingCompleteScreen } from '../pages/Onboarding/screens/OnboardingCompleteScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="BuyerOnboardingFlow" component={BuyerOnboardingFlowScreen} />
      <Stack.Screen name="SellerOnboardingFlow" component={SellerOnboardingFlowScreen} />
      <Stack.Screen name="TransporterOnboardingFlow" component={TransporterOnboardingFlowScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
}
