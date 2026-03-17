import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../../../../../../design-system';
import { useBuyerOrders, useBuyerTimeline } from './hooks';
import { ActiveOrdersList, OrdersStatsGrid, IncomingOffersList, BuyerTimeline } from './components';
import type { BuyerOrder } from './types';
import buyerService from '@services/buyerService';

// Module-level key extractor — stable reference
const keyExtractor = (item: BuyerOrder) => item.id;

export default function BuyerOrdersTab() {
  const {
    orders,
    stats,
    incomingOffers,
    expandedOrderId,
    isLoading,
    isRefreshing,
    isFetchingMore,
    toggleOrderExpand,
    refresh: refreshOrders,
    fetchMore,
  } = useBuyerOrders();

  const {
    events: timelineEvents,
    isLoading: isTimelineLoading,
    refresh: refreshTimeline,
  } = useBuyerTimeline();

  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshOrders(), refreshTimeline()]);
  }, [refreshOrders, refreshTimeline]);

  const handleConfirmDelivery = useCallback(
    async (orderId: string) => {
      Alert.alert(
        'Confirm Delivery',
        'Confirm that you have received the goods in satisfactory condition?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Receipt',
            style: 'default',
            onPress: async () => {
              try {
                setConfirmingDeliveryId(orderId);
                await buyerService.confirmDelivery(orderId);
                Alert.alert('Success', 'Delivery confirmed. Trade operation completed.');
                await handleRefresh();
              } catch (err: unknown) {
                const message =
                  err instanceof Error
                    ? err.message
                    : 'Failed to confirm delivery. Please try again.';
                Alert.alert('Error', message);
              } finally {
                setConfirmingDeliveryId(null);
              }
            },
          },
        ]
      );
    },
    [handleRefresh]
  );

  // Render a single order card as a FlatList item
  const renderOrderItem = useCallback(
    ({ item }: { item: BuyerOrder }) => (
      <ActiveOrdersList
        orders={[item]}
        expandedOrderId={expandedOrderId}
        onToggle={toggleOrderExpand}
        onConfirmDelivery={handleConfirmDelivery}
        confirmingDeliveryId={confirmingDeliveryId}
      />
    ),
    [expandedOrderId, toggleOrderExpand, handleConfirmDelivery, confirmingDeliveryId]
  );

  const ListHeader = (
    <View style={styles.headerContent}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Orders</Text>
        <Text style={styles.pageSubtitle}>Track your orders and purchase performance</Text>
      </View>

      <OrdersStatsGrid stats={stats} />

      <Text style={styles.sectionTitle}>Active Orders</Text>

      {isLoading && orders.length === 0 && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.info} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      )}

      {!isLoading && orders.length === 0 && (
        <Text style={styles.emptyText}>No orders yet. Accepted deals will appear here.</Text>
      )}
    </View>
  );

  const ListFooter = (
    <View style={styles.footerContent}>
      {isFetchingMore && (
        <View style={styles.fetchMoreWrap}>
          <ActivityIndicator color={COLORS.info} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Incoming Offers</Text>
      <IncomingOffersList offers={incomingOffers} />

      <BuyerTimeline
        events={timelineEvents}
        isLoading={isTimelineLoading}
        onRefresh={refreshTimeline}
      />

      <View style={styles.listEnd} />
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={orders}
        keyExtractor={keyExtractor}
        renderItem={renderOrderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.info}
            colors={[COLORS.info]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 24,
    textAlign: 'center',
  },
  fetchMoreWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerContent: {
    gap: 16,
    paddingTop: 8,
  },
  headerContent: {
    gap: 20,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  listEnd: {
    height: 40,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 12,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  pageHeader: {},
  pageSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
});
