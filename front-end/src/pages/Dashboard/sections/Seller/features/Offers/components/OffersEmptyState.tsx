import React from 'react';
import { View, Text } from 'react-native';
import { Target } from 'lucide-react-native';

export const OffersEmptyState = () => (
  <View className="bg-gray-50 rounded-lg p-8 items-center">
    <Target color="#6B7280" size={48} />
    <Text className="text-gray-900 font-semibold text-lg mt-4">No offers yet</Text>
    <Text className="text-gray-500 text-center mt-2">
      When buyers are interested in your products, their offers will appear here.
    </Text>
  </View>
);
