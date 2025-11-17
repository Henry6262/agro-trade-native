import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useBuyerOrders } from './hooks';
import { OrdersStatsGrid, ActiveOrdersList, IncomingOffersList } from './components';

export default function BuyerOrdersTab() {
  const { orders, stats, incomingOffers, expandedOrderId, isLoading, isRefreshing, toggleOrderExpand, refresh } =
    useBuyerOrders();

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-gray-400 mt-4">Loading your orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#60A5FA" />}
    >
      <View className="p-6 space-y-6">
        <View>
          <Text className="text-2xl font-bold text-white">My Orders</Text>
          <Text className="text-neutral-400">Track your orders and purchase performance</Text>
        </View>
        <OrdersStatsGrid stats={stats} />
        <View className="space-y-3">
          <Text className="text-white font-semibold text-lg">Active Orders</Text>
          <ActiveOrdersList orders={orders} expandedOrderId={expandedOrderId} onToggle={toggleOrderExpand} />
        </View>
        <View className="space-y-3">
          <Text className="text-white font-semibold text-lg">Incoming Offers</Text>
          <IncomingOffersList offers={incomingOffers} />
        </View>
      </View>
    </ScrollView>
  );
}
