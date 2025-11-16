import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { EarningsSummaryGrid, SellerTradeCard } from './components';
import { mockEarningsSummary, mockTraderTrades } from './utils';

export default function SellerTradesFeature() {
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;
  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="p-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white">My Trades</Text>
            <Text className="text-neutral-400">
              Track your active trades and earnings performance
            </Text>
          </View>
          <EarningsSummaryGrid summary={mockEarningsSummary} isMobile={isMobile} />
          <View>
            <Text className="text-xl font-semibold text-white mb-4">Active Trades</Text>
            {mockTraderTrades.map((trade) => (
              <SellerTradeCard key={trade.id} trade={trade} />
            ))}
          </View>
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
