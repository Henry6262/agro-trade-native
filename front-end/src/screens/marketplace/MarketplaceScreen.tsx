import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Card, Button } from '../../components/common';
import { useAuth } from '../../hooks';

export default function MarketplaceScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name || 'User'}!
          </Text>
          <Text className="text-base text-gray-600 mb-6">
            Discover fresh agricultural products
          </Text>

          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Featured Products
            </Text>
            <Text className="text-gray-600">
              Product listings will appear here once the backend is connected.
            </Text>
          </Card>

          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Categories
            </Text>
            <Text className="text-gray-600">
              Product categories will be displayed here.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}