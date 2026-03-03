import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../../../../../design-system';
import { useBuyerOrders, useBuyerTimeline } from './hooks';
import { OrdersStatsGrid, ActiveOrdersList, IncomingOffersList, BuyerTimeline } from './components';
import { tradeOperationService } from '@services/tradeOperationService';

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

  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshOrders(), refreshTimeline()]);
  }, [refreshOrders, refreshTimeline]);

  const handleConfirmDelivery = useCallback(
    async (orderId: string) => {
      // TODO: Backend needs a buyer-specific delivery confirmation endpoint.
      // POST /trade-operations/:id/finalize is currently ADMIN-only.
      // Once a buyer-facing endpoint (e.g. POST /buyer/orders/:id/confirm-receipt) is added,
      // replace this call with that endpoint.
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
                await tradeOperationService.finalizeTradeOperation(orderId, {
                  finalSellingPrice: 0,
                  finalPurchasePrices: [],
                  actualTransportCost: 0,
                });
                Alert.alert('Success', 'Delivery confirmed. Trade operation completed.');
                await handleRefresh();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } catch (err: any) {
                Alert.alert(
                  'Error',
                  err?.message ?? 'Failed to confirm delivery. Please try again.'
                );
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

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.info} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.info}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>My Orders</Text>
          <Text style={styles.pageSubtitle}>Track your orders and purchase performance</Text>
        </View>

        <OrdersStatsGrid stats={stats} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          <ActiveOrdersList
            orders={orders}
            expandedOrderId={expandedOrderId}
            onToggle={toggleOrderExpand}
            onConfirmDelivery={handleConfirmDelivery}
            confirmingDeliveryId={confirmingDeliveryId}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Offers</Text>
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

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    gap: 20,
    padding: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 12,
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
  scroll: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
});
