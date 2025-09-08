import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Card, Button } from '../../../shared/components';

export default function ProductDetailScreen() {
  const route = useRoute();
  const { productId } = route.params as { productId: string };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Card className="mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Product Details
            </Text>
            <Text className="text-gray-600 mb-4">
              Product ID: {productId}
            </Text>
            <Text className="text-gray-600">
              Product information will be loaded from the backend.
            </Text>
          </Card>

          <Button
            title="Add to Cart"
            fullWidth
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}