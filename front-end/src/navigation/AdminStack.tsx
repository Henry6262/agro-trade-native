import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';

// Import admin screens
import { AdminDashboardScreen } from '../pages/Admin/screens/AdminDashboardScreen';
import { AdminPricingZonesScreen } from '../pages/Admin/screens/AdminPricingZonesScreen';
import { AdminZoneDetailsScreen } from '../pages/Admin/screens/AdminZoneDetailsScreen';
import { AdminProductPricesScreen } from '../pages/Admin/screens/AdminProductPricesScreen';
import BulkPriceUpdateScreen from '../pages/Admin/screens/BulkPriceUpdateScreen';
import { AdminMapView } from '../pages/Admin/screens/AdminMapView';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerShadowVisible: false,
        headerTintColor: '#333333',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen
        name="AdminPricingZones"
        component={AdminPricingZonesScreen}
        options={{ title: 'Pricing Zones' }}
      />
      <Stack.Screen
        name="AdminZoneDetails"
        component={AdminZoneDetailsScreen}
        options={{ title: 'Zone Details' }}
      />
      <Stack.Screen
        name="AdminProductPrices"
        component={AdminProductPricesScreen}
        options={{ title: 'Product Prices' }}
      />
      <Stack.Screen
        name="BulkPriceUpdate"
        component={BulkPriceUpdateScreen}
        options={{ title: 'Bulk Price Update' }}
      />
      <Stack.Screen name="AdminMapView" component={AdminMapView} options={{ title: 'Map View' }} />
    </Stack.Navigator>
  );
}
