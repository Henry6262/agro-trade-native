import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Package,
  TrendingUp,
  DollarSign,
  ClipboardList,
  ChevronRight,
  Wheat,
  AlertCircle,
} from 'lucide-react-native';

import { DashboardStackParamList } from '../../../navigation/types';
import sellerService, {
  SellerStats,
  SellerTradeRecord,
  SellerOfferSummary,
} from '../../../services/sellerService';
import { sellerOfferService } from '../../../services/sellerOfferService';
import { GlassCard, StatCard, GlassBadge, GlassButton, COLORS } from '../../../design-system';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';

interface SellerDashboardSectionProps {
  activeTab?: string;
}

type NavigationProp = NativeStackNavigationProp<DashboardStackParamList>;

export function SellerDashboardSection({ activeTab = 'products' }: SellerDashboardSectionProps) {
  const navigation = useNavigation<NavigationProp>();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [trades, setTrades] = useState<SellerTradeRecord[]>([]);
  const [offers, setOffers] = useState<SellerOfferSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [statsData, tradesData, offersData] = await Promise.all([
        sellerService.getMyStats(),
        sellerService.getMyTrades({ limit: 20 }).then((res) =>
          Array.isArray(res) ? res : res.items || []
        ),
        sellerService.getMyOffers().then((res) => res.data?.offers || []),
      ]);
      setStats(statsData);
      setTrades(tradesData);
      setOffers(offersData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const navigateToTrade = (tradeId: string) => {
    navigation.navigate('TradeDetail', { tradeId });
  };

  const getStatusVariant = (status?: string | null): any => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete') || s.includes('delivered')) return 'success';
    if (s.includes('dispute') || s.includes('cancel')) return 'danger';
    if (s.includes('pending') || s.includes('await')) return 'warning';
    return 'info';
  };

  const renderStats = () => {
    if (!stats) return null;
    return (
      <View style={styles.statsRow}>
        <StatCard
          label="Active Listings"
          value={stats.activeListings}
          icon={<Package size={16} color={COLORS.accentGold} />}
          color={COLORS.accentGold}
          style={styles.statCard}
          delay={0}
        />
        <StatCard
          label="Pending Offers"
          value={stats.pendingOffers}
          icon={<ClipboardList size={16} color={COLORS.success} />}
          color={COLORS.success}
          style={styles.statCard}
          delay={50}
        />
        <StatCard
          label="Completed"
          value={stats.completedTrades}
          icon={<TrendingUp size={16} color={COLORS.success} />}
          color={COLORS.success}
          style={styles.statCard}
          delay={100}
        />
        <StatCard
          label="Revenue"
          value={stats.totalRevenue}
          prefix="$"
          icon={<DollarSign size={16} color={COLORS.accentGold} />}
          color={COLORS.accentGold}
          style={styles.statCard}
          delay={150}
        />
      </View>
    );
  };

  const renderTrades = () => {
    if (trades.length === 0) {
      return (
        <EmptyState
          title="No trades yet"
          subtitle="Your completed trades will appear here once negotiations are finalized."
          icon={<Package size={32} color="rgba(255,255,255,0.3)" />}
        />
      );
    }
    return (
      <View style={styles.list}>
        {trades.map((trade, index) => (
          <TouchableOpacity
            key={trade.id || index}
            onPress={() => navigateToTrade(trade.id)}
            activeOpacity={0.8}
          >
            <GlassCard tier="medium" style={styles.listCard} delay={index * 40}>
              <View style={styles.listCardHeader}>
                <View style={styles.listCardTitleRow}>
                  <Text style={styles.listCardTitle} numberOfLines={1}>
                    {trade.productName || trade.product?.name || 'Unknown Product'}
                  </Text>
                  <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
                </View>
                <GlassBadge
                  label={trade.status || 'PENDING'}
                  variant={getStatusVariant(trade.status)}
                  size="sm"
                />
              </View>
              <View style={styles.listCardMeta}>
                <Text style={styles.listCardMetaText}>
                  {trade.buyerName || trade.buyer?.name || 'Unknown Buyer'}
                </Text>
                <Text style={styles.listCardMetaText}>•</Text>
                <Text style={styles.listCardMetaText}>
                  {trade.agreedQuantity || trade.quantity || 0} {trade.unit || 'tons'}
                </Text>
                <Text style={styles.listCardMetaText}>•</Text>
                <Text style={styles.listCardMetaText}>
                  ${trade.agreedPrice || trade.agreedPricePerTon || 0}/unit
                </Text>
              </View>
              {trade.pickupDate && (
                <Text style={styles.listCardDate}>
                  Pickup: {new Date(trade.pickupDate).toLocaleDateString()}
                </Text>
              )}
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleAcceptOffer = async (negotiationId: string) => {
    setActionLoading(negotiationId);
    try {
      await sellerOfferService.acceptOffer(negotiationId);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to accept offer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (negotiationId: string) => {
    setActionLoading(negotiationId);
    try {
      await sellerOfferService.rejectOffer(negotiationId);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject offer');
    } finally {
      setActionLoading(null);
    }
  };

  const renderOffers = () => {
    if (offers.length === 0) {
      return (
        <EmptyState
          title="No active offers"
          subtitle="Buyers haven't sent any offers yet. Make sure your products are visible in the marketplace."
          icon={<ClipboardList size={32} color="rgba(255,255,255,0.3)" />}
        />
      );
    }
    return (
      <View style={styles.list}>
        {offers.map((offer, index) => {
          const isPending = (offer.status || '').toLowerCase() === 'pending';
          const isLoading = actionLoading === offer.negotiationId;
          return (
            <GlassCard key={offer.id || index} tier="medium" style={styles.listCard} delay={index * 40}>
              <View style={styles.listCardHeader}>
                <View style={styles.listCardTitleRow}>
                  <Text style={styles.listCardTitle} numberOfLines={1}>
                    {offer.product}
                  </Text>
                  {offer.isExpiringSoon && (
                    <AlertCircle size={14} color={COLORS.danger} />
                  )}
                </View>
                <GlassBadge
                  label={offer.status}
                  variant={getStatusVariant(offer.status)}
                  size="sm"
                />
              </View>
              <View style={styles.listCardMeta}>
                <Text style={styles.listCardMetaText}>{offer.buyer}</Text>
                <Text style={styles.listCardMetaText}>•</Text>
                <Text style={styles.listCardMetaText}>
                  {offer.quantity} tons @ ${offer.offeredPricePerTon}/ton
                </Text>
              </View>
              <View style={styles.offerValueRow}>
                <Text style={styles.offerValueText}>
                  Total Value: <Text style={styles.offerValueHighlight}>${offer.totalValue.toLocaleString()}</Text>
                </Text>
                {offer.hoursUntilExpiry !== undefined && (
                  <Text style={styles.offerExpiryText}>
                    {offer.hoursUntilExpiry <= 0
                      ? 'Expired'
                      : `${Math.floor(offer.hoursUntilExpiry)}h left`}
                  </Text>
                )}
              </View>
              {offer.estimatedProfit > 0 && (
                <Text style={styles.offerProfitText}>
                  Est. Profit: ${offer.estimatedProfit.toLocaleString()}
                </Text>
              )}
              {isPending && (
                <View style={styles.offerActions}>
                  <GlassButton
                    label={isLoading ? '...' : 'Reject'}
                    onPress={() => handleRejectOffer(offer.negotiationId)}
                    variant="ghost"
                    size="sm"
                    style={styles.actionBtn}
                    disabled={isLoading}
                  />
                  <GlassButton
                    label={isLoading ? '...' : 'Accept'}
                    onPress={() => handleAcceptOffer(offer.negotiationId)}
                    variant="primary"
                    size="sm"
                    style={styles.actionBtn}
                    disabled={isLoading}
                  />
                </View>
              )}
            </GlassCard>
          );
        })}
      </View>
    );
  };

  const renderProducts = () => (
    <EmptyState
      title="Products"
      subtitle="Manage your product listings from the marketplace tab."
      icon={<Wheat size={32} color="rgba(255,255,255,0.3)" />}
    />
  );

  const renderMarket = () => (
    <EmptyState
      title="Market Intelligence"
      subtitle="Price trends and demand forecasts coming soon."
      icon={<TrendingUp size={32} color="rgba(255,255,255,0.3)" />}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Loading dashboard..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Error loading dashboard"
          subtitle={error}
          cta="Retry"
          onPress={fetchData}
          icon={<AlertCircle size={32} color={COLORS.danger} />}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentGreen} />
      }
    >
      {renderStats()}
      <View style={styles.tabContent}>
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'offers' && renderOffers()}
        {activeTab === 'trades' && renderTrades()}
        {(activeTab === 'market' || activeTab === 'intelligence') && renderMarket()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    minWidth: 140,
  },
  tabContent: {
    flex: 1,
  },
  list: {
    gap: 12,
  },
  listCard: {
    marginBottom: 12,
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  listCardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  listCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  listCardMetaText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  listCardDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
  },
  offerValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  offerValueText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  offerValueHighlight: {
    color: COLORS.accentGold,
    fontWeight: '700',
  },
  offerExpiryText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  offerProfitText: {
    color: COLORS.success,
    fontSize: 12,
    marginTop: 4,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actionBtn: {
    flex: 1,
  },
});

export default SellerDashboardSection;
