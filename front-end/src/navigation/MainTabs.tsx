import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';

// Import screens (will be created next)
import MarketplaceScreen from '../screens/marketplace/MarketplaceScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SearchScreen from '../screens/marketplace/SearchScreen';

// Import icons (placeholder for now)
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder icon component
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <View className={`w-6 h-6 rounded-full ${focused ? 'bg-primary-500' : 'bg-gray-400'}`}>
    <Text className="text-xs text-center text-white">{name[0]}</Text>
  </View>
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Marketplace"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: 'Marketplace',
          tabBarIcon: ({ focused }) => <TabIcon name="Marketplace" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon name="Search" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon name="Orders" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}