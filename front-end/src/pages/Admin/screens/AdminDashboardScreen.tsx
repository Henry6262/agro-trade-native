import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';

type AdminNavigationProp = NativeStackNavigationProp<AdminStackParamList>;

interface AdminCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: keyof AdminStackParamList;
  stats?: { label: string; value: string | number }[];
}

export function AdminDashboardScreen() {
  const navigation = useNavigation<AdminNavigationProp>();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const adminCards: AdminCard[] = [
    {
      id: 'pricing-zones',
      title: 'Pricing Zones',
      description: 'Manage regional pricing zones and city assignments',
      icon: 'map-outline',
      color: '#3B82F6',
      route: 'AdminPricingZones',
      stats: [
        { label: 'Active Zones', value: 9 },
        { label: 'Cities Covered', value: 43 },
      ],
    },
    {
      id: 'product-prices',
      title: 'Product Pricing',
      description: 'Set and update product prices for different zones',
      icon: 'pricetag-outline',
      color: '#10B981',
      route: 'AdminProductPrices',
      stats: [
        { label: 'Products', value: 12 },
        { label: 'Price Points', value: 108 },
      ],
    },
    {
      id: 'market-conditions',
      title: 'Market Conditions',
      description: 'Update supply, demand, and market factors',
      icon: 'trending-up-outline',
      color: '#F59E0B',
      route: 'AdminDashboard', // AdminMarketConditions not in AdminStackParamList
      stats: [
        { label: 'Supply Level', value: '75%' },
        { label: 'Demand Level', value: '82%' },
      ],
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View pricing analytics and market insights',
      icon: 'analytics-outline',
      color: '#8B5CF6',
      route: 'AdminDashboard', // AdminAnalytics not in AdminStackParamList
      stats: [
        { label: 'Avg Price Change', value: '+3.2%' },
        { label: 'Active Listings', value: 247 },
      ],
    },
  ];

  const handleCardPress = (card: AdminCard) => {
    setSelectedCard(card.id);
    setTimeout(() => {
      // Navigate to the specific admin screen
      // Use type assertion to help TypeScript understand the route is valid
      navigation.navigate(card.route as any);
      setSelectedCard(null);
    }, 150);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</Text>
            <Text className="text-gray-400">Manage pricing zones and market data</Text>
          </View>

          {/* Admin Cards Grid */}
          <View className="flex-row flex-wrap -mx-2">
            {adminCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardPress(card)}
                className={`w-1/2 p-2 ${selectedCard === card.id ? 'opacity-70' : ''}`}
                activeOpacity={0.8}
              >
                <View
                  className="bg-white rounded-xl p-5 border border-gray-200"
                  style={styles.cardShadow}
                >
                  {/* Icon */}
                  <View
                    className="w-12 h-12 rounded-lg items-center justify-center mb-4"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Ionicons name={card.icon} size={24} color={card.color} />
                  </View>

                  {/* Title & Description */}
                  <Text className="text-gray-900 font-semibold text-lg mb-1">{card.title}</Text>
                  <Text className="text-gray-400 text-sm mb-4" numberOfLines={2}>
                    {card.description}
                  </Text>

                  {/* Stats */}
                  {card.stats && (
                    <View className="border-t border-gray-200 pt-3 mt-3">
                      {card.stats.map((stat, index) => (
                        <View key={index} className="flex-row justify-between mb-1">
                          <Text className="text-gray-500 text-xs">{stat.label}</Text>
                          <Text className="text-gray-900 text-xs font-medium">{stat.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View className="mt-8 bg-white rounded-xl p-5 border border-gray-200">
            <Text className="text-gray-900 font-semibold text-lg mb-4">Quick Actions</Text>
            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => navigation.navigate('BulkPriceUpdate')}
                className="flex-row items-center bg-gray-700 rounded-lg p-4"
              >
                <Ionicons name="flash-outline" size={20} color="#F59E0B" />
                <Text className="text-gray-900 ml-3 flex-1">Bulk Update Prices</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('AdminDashboard')}
                className="flex-row items-center bg-gray-700 rounded-lg p-4"
              >
                <Ionicons name="download-outline" size={20} color="#10B981" />
                <Text className="text-gray-900 ml-3 flex-1">Import/Export Data</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('AdminMapView')}
                className="flex-row items-center bg-gray-700 rounded-lg p-4"
              >
                <Ionicons name="map-outline" size={20} color="#3B82F6" />
                <Text className="text-gray-900 ml-3 flex-1">View Zone Map</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
