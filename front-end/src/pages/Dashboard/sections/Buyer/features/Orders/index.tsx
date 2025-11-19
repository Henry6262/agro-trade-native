import React, { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useBuyerOrders, useBuyerTimeline } from './hooks';
import { OrdersStatsGrid, ActiveOrdersList, IncomingOffersList, BuyerTimeline } from './components';

export default function BuyerOrdersTab() {
  const {
    orders,
    stats,
    incomingOffers,
    expandedOrderId,
    isLoading,
    isRefreshing,
    toggleOrderExpand,
    refresh: refreshOrders,
  } = useBuyerOrders();
  const {
    events: timelineEvents,
    isLoading: isTimelineLoading,
    refresh: refreshTimeline,
  } = useBuyerTimeline();

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshOrders(), refreshTimeline()]);
  }, [refreshOrders, refreshTimeline]);

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
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#60A5FA"
        />
      }
    >
      <View className="p-6 space-y-6">
        <View>
          <Text className="text-2xl font-bold text-white">My Orders</Text>
          <Text className="text-neutral-400">Track your orders and purchase performance</Text>
        </View>
        <OrdersStatsGrid stats={stats} />
        <View className="space-y-3">
          <Text className="text-white font-semibold text-lg">Active Orders</Text>
          <ActiveOrdersList
            orders={orders}
            expandedOrderId={expandedOrderId}
            onToggle={toggleOrderExpand}
          />
        </View>
        <View className="space-y-3">
          <Text className="text-white font-semibold text-lg">Incoming Offers</Text>
          <IncomingOffersList offers={incomingOffers} />
        </View>
        <BuyerTimeline
          events={timelineEvents}
          isLoading={isTimelineLoading}
          onRefresh={refreshTimeline}
        />
      </View>
    </ScrollView>
  );
}
