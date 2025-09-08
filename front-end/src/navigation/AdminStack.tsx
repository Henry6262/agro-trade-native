import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';

// Import admin screens
import { AdminDashboardScreen } from '../features/admin/screens/AdminDashboardScreen';
import { AdminPricingZonesScreen } from '../features/admin/screens/AdminPricingZonesScreen';
import { AdminZoneDetailsScreen } from '../features/admin/screens/AdminZoneDetailsScreen';
import { AdminProductPricesScreen } from '../features/admin/screens/AdminProductPricesScreen';
import BulkPriceUpdateScreen from '../features/admin/screens/BulkPriceUpdateScreen';
import { AdminMapView } from '../features/admin/screens/AdminMapView';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
          shadowColor: 'transparent',
          elevation: 0,
        },
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
      <Stack.Screen 
        name="AdminMapView" 
        component={AdminMapView} 
        options={{ title: 'Map View' }}
      />
    </Stack.Navigator>
  );
}