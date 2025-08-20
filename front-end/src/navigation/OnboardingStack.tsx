import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { OnboardingStackParamList } from '../types';

// Onboarding Screens
import { RoleSelectionScreen } from '../screens/onboarding/RoleSelectionScreen';
import { 
  SellerProductSelectionScreen,
  BuyerProductSelectionScreen,
} from '../screens/onboarding/ProductSelectionScreen';
import { SellerProductDetailsScreen } from '../screens/onboarding/seller/ProductDetailsScreen';
import { SellerMarketInsightsScreen } from '../screens/onboarding/seller/MarketInsightsScreen';
import { BuyerRequirementsScreen } from '../screens/onboarding/buyer/RequirementsScreen';
import { BuyerMarketOverviewScreen } from '../screens/onboarding/buyer/MarketOverviewScreen';
import { TransportFleetInfoScreen } from '../screens/onboarding/transport/FleetInfoScreen';
import { TransportJobPreferencesScreen } from '../screens/onboarding/transport/JobPreferencesScreen';
import { TransportOpportunitiesScreen } from '../screens/onboarding/transport/OpportunitiesScreen';
import { AccountCreationScreen } from '../screens/onboarding/AccountCreationScreen';
import { OnboardingCompleteScreen } from '../screens/onboarding/OnboardingCompleteScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back during onboarding
        cardStyleInterpolator: ({ current, next, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
                {
                  scale: next
                    ? next.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.9],
                      })
                    : 1,
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
      }}
    >
      {/* Role Selection */}
      <Stack.Screen 
        name="RoleSelection" 
        component={RoleSelectionScreen}
        options={{
          title: 'Choose Your Role',
        }}
      />

      {/* Seller Flow */}
      <Stack.Screen 
        name="SellerProductSelection" 
        component={SellerProductSelectionScreen}
        options={{
          title: 'Select Products',
        }}
      />
      <Stack.Screen 
        name="SellerProductDetails" 
        component={SellerProductDetailsScreen}
        options={{
          title: 'Product Details',
        }}
      />
      <Stack.Screen 
        name="SellerMarketInsights" 
        component={SellerMarketInsightsScreen}
        options={{
          title: 'Market Insights',
        }}
      />

      {/* Buyer Flow */}
      <Stack.Screen 
        name="BuyerProductSelection" 
        component={BuyerProductSelectionScreen}
        options={{
          title: 'Select Products',
        }}
      />
      <Stack.Screen 
        name="BuyerRequirements" 
        component={BuyerRequirementsScreen}
        options={{
          title: 'Requirements',
        }}
      />
      <Stack.Screen 
        name="BuyerMarketOverview" 
        component={BuyerMarketOverviewScreen}
        options={{
          title: 'Market Overview',
        }}
      />

      {/* Transport Flow */}
      <Stack.Screen 
        name="TransportFleetInfo" 
        component={TransportFleetInfoScreen}
        options={{
          title: 'Fleet Information',
        }}
      />
      <Stack.Screen 
        name="TransportJobPreferences" 
        component={TransportJobPreferencesScreen}
        options={{
          title: 'Job Preferences',
        }}
      />
      <Stack.Screen 
        name="TransportOpportunities" 
        component={TransportOpportunitiesScreen}
        options={{
          title: 'Opportunities',
        }}
      />

      {/* Common Screens */}
      <Stack.Screen 
        name="AccountCreation" 
        component={AccountCreationScreen}
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen 
        name="OnboardingComplete" 
        component={OnboardingCompleteScreen}
        options={{
          title: 'Welcome!',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};