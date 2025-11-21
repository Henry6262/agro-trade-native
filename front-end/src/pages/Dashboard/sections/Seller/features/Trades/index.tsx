import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { EarningsSummaryGrid, SellerTradeCard } from './components';
import { useSellerTrades } from './hooks';

export default function SellerTradesFeature() {
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;
  const { trades, summary, isLoading, refresh } = useSellerTrades();

  const isRefreshing = isLoading && trades.length > 0;

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor="#FB923C"
            colors={['#FB923C']}
          />
        }
      >
        <View className="p-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white">My Trades</Text>
            <Text className="text-neutral-400">
              Track your active trades and earnings performance
            </Text>
          </View>
          <EarningsSummaryGrid summary={summary} isMobile={isMobile} />
          <View>
            <Text className="text-xl font-semibold text-white mb-4">Active Trades</Text>
            {isLoading && trades.length === 0 ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color="#FB923C" />
                <Text className="text-neutral-400 mt-3">Loading trades...</Text>
              </View>
            ) : trades.length === 0 ? (
              <Text className="text-neutral-400">
                No trades yet. Accepted deals will appear here.
              </Text>
            ) : (
              trades.map((trade) => <SellerTradeCard key={trade.id} trade={trade} />)
            )}
          </View>
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
