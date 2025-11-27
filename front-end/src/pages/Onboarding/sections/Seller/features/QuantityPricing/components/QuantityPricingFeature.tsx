import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text } from 'react-native';
import { PresetQuantitySelector } from './QuantityPricingStep/PresetQuantitySelector';
import { CustomQuantityInput } from './QuantityPricingStep/CustomQuantityInput';
import { LocationPicker } from './QuantityPricingStep/LocationPicker';
import { SummaryCard } from './QuantityPricingStep/SummaryCard';
import { ActionButtons } from './QuantityPricingStep/ActionButtons';
import { useQuantityPricing } from '../hooks/useQuantityPricing';

export function QuantityPricingFeature() {
  const state = useQuantityPricing();

  if (state.isInitializing) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-4 text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
      <PresetQuantitySelector state={state} />
      <CustomQuantityInput state={state} />
      <LocationPicker state={state} />
      <SummaryCard state={state} />
      <ActionButtons state={state} />
    </ScrollView>
  );
}

export default QuantityPricingFeature;
