import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';

import QuickOnboardingScreen from '../screens/onboarding/QuickOnboardingScreen';
import { OnboardingCompleteScreen } from '../screens/onboarding/OnboardingCompleteScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="RoleSelection" component={QuickOnboardingScreen} />
      <Stack.Screen name="BuyerOnboardingFlow" component={QuickOnboardingScreen} />
      <Stack.Screen name="SellerOnboardingFlow" component={QuickOnboardingScreen} />
      <Stack.Screen name="TransporterOnboardingFlow" component={QuickOnboardingScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
}
