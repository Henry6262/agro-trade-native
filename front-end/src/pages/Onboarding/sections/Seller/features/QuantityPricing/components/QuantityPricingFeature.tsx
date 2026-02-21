import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { QuantityPricingStep } from './QuantityPricingStep';

export function QuantityPricingFeature() {
  const [isInitializing] = React.useState(false);
  const state = { isInitializing };

  if (state.isInitializing) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-4 text-gray-400">Loading...</Text>
      </View>
    );
  }

  return <QuantityPricingStep />;
}

export default QuantityPricingFeature;
