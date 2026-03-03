import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../../../../../design-system';
import { EarningsSummaryGrid, SellerTradeCard } from './components';
import { useSellerTrades } from './hooks';

export default function SellerTradesFeature() {
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;
  const { trades, summary, isLoading, refresh } = useSellerTrades();

  const isRefreshing = isLoading && trades.length > 0;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={COLORS.accentGreen}
            colors={[COLORS.accentGreen]}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>My Trades</Text>
            <Text style={styles.pageSubtitle}>
              Track your active trades and earnings performance
            </Text>
          </View>

          <EarningsSummaryGrid summary={summary} isMobile={isMobile} />

          <View>
            <Text style={styles.sectionTitle}>Active Trades</Text>
            {isLoading && trades.length === 0 ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={COLORS.accentGreen} />
                <Text style={styles.loadingText}>Loading trades...</Text>
              </View>
            ) : trades.length === 0 ? (
              <Text style={styles.emptyText}>No trades yet. Accepted deals will appear here.</Text>
            ) : (
              trades.map((trade) => <SellerTradeCard key={trade.id} trade={trade} />)
            )}
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSpacer: {
    height: 80,
  },
  content: {
    padding: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 24,
    textAlign: 'center',
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
  scroll: {
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
});
