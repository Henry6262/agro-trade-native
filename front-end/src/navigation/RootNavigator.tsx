import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';

// Import stack navigators
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

// Import individual screens that are not in tabs
import OrderCreateScreen from '../screens/orders/OrderCreateScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import ProductDetailScreen from '../screens/marketplace/ProductDetailScreen';

// Import store for auth state
import { useAuthStore } from '../store/authStore';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#ffffff' },
          gestureEnabled: true,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Main" component={MainTabs} />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}