import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Card, Button } from '../../components/common';

export default function OrderDetailScreen() {
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Card className="mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Order Details
            </Text>
            <Text className="text-gray-600 mb-4">
              Order ID: {orderId}
            </Text>
            <Text className="text-gray-600">
              Order information will be loaded from the backend.
            </Text>
          </Card>

          <Button
            title="Track Order"
            fullWidth
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}