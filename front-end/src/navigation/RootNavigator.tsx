import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { linking } from './linking';

// Import stack navigators
import AuthStack from './AuthStack';  
import DashboardStack from './DashboardStack';
import { OnboardingStack } from './OnboardingStack';

// Import individual screens that are not in tabs
import OrderCreateScreen from '../screens/orders/OrderCreateScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import ProductDetailScreen from '../screens/marketplace/ProductDetailScreen';
import { OAuthCallbackScreen } from '../screens/auth/OAuthCallbackScreen';

// Import store for auth state
import { useAuthStore } from '../store/authStore';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  // Bypassing authentication - directly show main app
  // const { isAuthenticated } = useAuthStore();

  // Determine initial route based on URL for web
  let initialRouteName: keyof RootStackParamList = 'Main';
  if (typeof window !== 'undefined' && window.location) {
    const pathname = window.location.pathname;
    if (pathname.includes('/auth/callback')) {
      initialRouteName = 'OAuthCallback';
    }
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#ffffff' },
          gestureEnabled: true,
        }}
      >
        {/* OAuth Callback Screen - needs to be accessible directly for deep linking */}
        <Stack.Screen name="OAuthCallback" component={OAuthCallbackScreen} />
        {/* Onboarding Stack - should be before Main for proper navigation flow */}
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
        {/* Auth Stack available but not shown by default */}
        <Stack.Screen name="Auth" component={AuthStack} />
        {/* Main App Stack */}
        <Stack.Screen name="Main" component={DashboardStack} />
        <Stack.Screen
          name="OrderCreate"
          component={OrderCreateScreen}
          options={{
            headerShown: true,
            title: 'Create Order',
            headerStyle: {
              backgroundColor: '#ffffff',
              shadowColor: 'transparent',
              elevation: 0,
            },
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
              shadowColor: 'transparent',
              elevation: 0,
            },
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
              shadowColor: 'transparent',
              elevation: 0,
            },
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
  );
}