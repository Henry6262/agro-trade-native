import React from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { COLORS } from '@design-system';
import { EarningsSummaryGrid, SellerTradeCard } from './components';
import { useSellerTrades } from './hooks';
import type { SellerTrade } from './types';

const renderTradeItem = ({ item }: { item: SellerTrade }) => <SellerTradeCard trade={item} />;
const keyExtractor = (item: SellerTrade) => item.id;

export default function SellerTradesFeature() {
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;
  const { trades, summary, isLoading, isFetchingMore, fetchMore, refresh } = useSellerTrades();

  const isRefreshing = isLoading && trades.length > 0;

  const ListHeader = (
    <View style={styles.content}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Trades</Text>
        <Text style={styles.pageSubtitle}>Track your active trades and earnings performance</Text>
      </View>
      <EarningsSummaryGrid summary={summary} isMobile={isMobile} />
      <Text style={styles.sectionTitle}>Active Trades</Text>
      {isLoading && trades.length === 0 && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.accentGreen} />
          <Text style={styles.loadingText}>Loading trades...</Text>
        </View>
      )}
      {!isLoading && trades.length === 0 && (
        <Text style={styles.emptyText}>No trades yet. Accepted deals will appear here.</Text>
      )}
    </View>
  );

  const ListFooter = (
    <View style={styles.footer}>
      {isFetchingMore && <ActivityIndicator color={COLORS.accentGreen} />}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={trades}
        keyExtractor={keyExtractor}
        renderItem={renderTradeItem}
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
            onRefresh={refresh}
            tintColor={COLORS.accentGreen}
            colors={[COLORS.accentGreen]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 24,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  pageHeader: {
    marginBottom: 20,
  },
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
});
