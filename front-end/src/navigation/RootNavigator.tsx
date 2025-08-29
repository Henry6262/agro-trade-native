import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { linking } from './linking';

// Import stack navigators
import AuthStack from './AuthStack';  
import DashboardStack from './DashboardStack';

// Import individual screens that are not in tabs
import OrderCreateScreen from '../screens/orders/OrderCreateScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import ProductDetailScreen from '../screens/marketplace/ProductDetailScreen';
import { OAuthCallbackScreen } from '../screens/auth/OAuthCallbackScreen';

// Import Onboarding Screens directly (flatten OnboardingStack)
import { RoleSelectionScreen } from '../screens/onboarding/RoleSelectionScreen';
import { BuyerOnboardingFlowScreen } from '../screens/onboarding/buyer/BuyerOnboardingFlowScreen';
import { SellerOnboardingFlowScreen } from '../screens/onboarding/seller/SellerOnboardingFlowScreen';
import { TransporterOnboardingFlowScreen } from '../screens/onboarding/transporter/TransporterOnboardingFlowScreen';
import { OnboardingCompleteScreen } from '../screens/onboarding/OnboardingCompleteScreen';

// Import Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminPricingZonesScreen } from '../screens/admin/AdminPricingZonesScreen';  
import { AdminZoneDetailsScreen } from '../screens/admin/AdminZoneDetailsScreen';
import { AdminProductPricesScreen } from '../screens/admin/AdminProductPricesScreen';
import BulkPriceUpdateScreen from '../screens/admin/BulkPriceUpdateScreen';
import { AdminMapView } from '../screens/admin/AdminMapView';

const Stack = createStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  appState: {
    isAuthenticated: boolean;
    needsOnboarding: boolean;
    isReady: boolean;
  };
}

export default function RootNavigator({ appState }: RootNavigatorProps) {

  // Determine initial route based on URL for web and app state
  let initialRouteName: keyof RootStackParamList = 'Main';
  
  if (typeof window !== 'undefined' && window.location) {
    const pathname = window.location.pathname;
    if (pathname.includes('/auth/callback')) {
      initialRouteName = 'OAuthCallback';
    } else if (appState.isAuthenticated) {
      // Always go to dashboard if authenticated
      initialRouteName = 'Main';
    }
  } else if (appState.isReady) {
    // Only determine route after app initialization is complete
    if (!appState.isAuthenticated) {
      initialRouteName = 'RoleSelection';
    } else {
      // Always go to dashboard if authenticated
      initialRouteName = 'Main';
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
          
          {/* Onboarding Screens - flattened from OnboardingStack */}
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          <Stack.Screen name="BuyerOnboardingFlow" component={BuyerOnboardingFlowScreen} />
          <Stack.Screen name="SellerOnboardingFlow" component={SellerOnboardingFlowScreen} />
          <Stack.Screen name="TransporterOnboardingFlow" component={TransporterOnboardingFlowScreen} />
          <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
          
          {/* Base Management */}
          <Stack.Screen name="BaseManagement" component={require('../screens/dashboard/BaseManagementScreen').default} />
          
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
          
          {/* Admin Screens */}
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="AdminPricingZones" component={AdminPricingZonesScreen} />
          <Stack.Screen name="AdminZoneDetails" component={AdminZoneDetailsScreen} />
          <Stack.Screen name="AdminProductPrices" component={AdminProductPricesScreen} />
          <Stack.Screen name="AdminBulkPriceUpdate" component={BulkPriceUpdateScreen} />
          <Stack.Screen name="AdminMapView" component={AdminMapView} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}