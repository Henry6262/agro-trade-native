import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { CharacterTourOverlay } from '../features/onboarding/components/CharacterTourOverlay';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { linking } from './linking';
import { navigationRef, flushPendingNavigation } from './navigationRef';

// Import stack navigators
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import DashboardStack from './DashboardStack';
import AdminStack from './AdminStack';

// Import individual screens that are not in stacks
import OrderCreateScreen from '../screens/orders/OrderCreateScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import ProductDetailScreen from '../screens/marketplace/ProductDetailScreen';
import { OAuthCallbackScreen } from '../pages/Auth/screens/OAuthCallbackScreen';
import { AIModeScreen } from '../features/ai-mode/screens/AIModeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  appState: {
    isAuthenticated: boolean;
    needsOnboarding: boolean;
    isReady: boolean;
  };
}

export default function RootNavigator({ appState }: RootNavigatorProps) {
  // Determine initial route based on authentication state
  let initialRouteName: keyof RootStackParamList = 'Main';

  // If not authenticated, show onboarding (role selection) first
  // Authentication happens at the END of onboarding
  if (appState.isReady && !appState.isAuthenticated) {
    initialRouteName = 'Onboarding'; // Show role selection, not login
  }

  return (
    <>
      <NavigationContainer ref={navigationRef} linking={linking} onReady={flushPendingNavigation}>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#ffffff' },
          }}
        >
          {/* OAuth Callback Screen - for deep linking */}
          <Stack.Screen name="OAuthCallback" component={OAuthCallbackScreen} />

          {/* Authentication Stack */}
          <Stack.Screen name="Auth" component={AuthStack} />

          {/* Onboarding Stack */}
          <Stack.Screen name="Onboarding" component={OnboardingStack} />

          {/* Main App Stack */}
          <Stack.Screen name="Main" component={DashboardStack} />

          {/* AI Mode Screen */}
          <Stack.Screen
            name="AIMode"
            component={AIModeScreen}
            options={{ animation: 'slide_from_bottom' }}
          />

          {/* Admin Stack */}
          <Stack.Screen name="Admin" component={AdminStack} />
          <Stack.Screen
            name="OrderCreate"
            component={OrderCreateScreen}
            options={{
              headerShown: true,
              title: 'Create Order',
              headerStyle: {
                backgroundColor: '#ffffff',
              },
              headerShadowVisible: false,
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
                color: '#1F2937',
              },
              headerTintColor: '#22C55E',
            }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              headerShown: true,
              title: 'Order Details',
              headerStyle: {
                backgroundColor: '#ffffff',
              },
              headerShadowVisible: false,
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
                color: '#1F2937',
              },
              headerTintColor: '#22C55E',
            }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              headerShown: true,
              title: 'Product Details',
              headerStyle: {
                backgroundColor: '#ffffff',
              },
              headerShadowVisible: false,
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
                color: '#1F2937',
              },
              headerTintColor: '#22C55E',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Character tour overlay — renders above navigation on first dashboard visit */}
      <CharacterTourOverlay />
    </>
  );
}
