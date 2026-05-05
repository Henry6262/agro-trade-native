import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Bell,
  TrendingUp,
  Package,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Users,
} from 'lucide-react-native';
import { GlassCard, GlassBadge } from '@design-system';
import { COLORS } from '@design-system';
import { tradeOperationService, TradeOperation, TradeOperationAnalytics } from '../../../services/tradeOperationService';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';
import { socketService } from '../../../services/socketService';

const DIVIDER = { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 6 };

interface LiveEvent {
  id: string;
  time: string;
  type: 'sale' | 'match' | 'alert' | 'listing' | 'transport' | 'delivery';
  trader: string;
  action: string;
  location: string;
  buyer?: string | null;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function deriveEvents(operations: TradeOperation[]): LiveEvent[] {
  return operations.slice(0, 12).map((op) => {
    const status = (op.status || '').toLowerCase();
    const phase = (op.phase || '').toLowerCase();
    const productName = op.buyListing?.product?.name || 'Unknown Product';
    const buyerName = op.buyListing?.buyer?.name || 'Unknown Buyer';
    const location = op.buyListing?.deliveryAddress
      ? `${op.buyListing.deliveryAddress.city || ''}, ${op.buyListing.deliveryAddress.country || ''}`.replace(/^,\s*/, '').trim()
      : 'Unknown Location';

    let type: LiveEvent['type'] = 'listing';
    let action = `created trade for ${op.buyListing?.quantity || 0}T ${productName}`;

    if (status === 'completed' || phase === 'completed') {
      type = 'sale';
      action = `completed sale of ${op.buyListing?.quantity || 0}T ${productName}`;
    } else if (status === 'matched' || phase === 'matched') {
      type = 'match';
      action = `order matched for ${op.buyListing?.quantity || 0}T ${productName}`;
    } else if (status === 'transit' || phase === 'in_transit') {
      type = 'transport';
      action = `in transit — ${op.buyListing?.quantity || 0}T ${productName}`;
    } else if (status === 'delivered' || phase === 'delivered') {
      type = 'delivery';
      action = `delivery completed — ${op.buyListing?.quantity || 0}T ${productName}`;
    } else if (status === 'disputed') {
      type = 'alert';
      action = `dispute raised on ${productName}`;
    }

    return {
      id: op.id,
      time: timeAgo(op.updatedAt || op.createdAt),
      type,
      trader: op.admin?.name || 'Admin',
      action,
      location,
      buyer: buyerName,
    };
  });
}

export default function CommandCenterScreen() {
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [analytics, setAnalytics] = useState<TradeOperationAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [ops, analyticsData] = await Promise.all([
        tradeOperationService.getAll(),
        tradeOperationService.getAnalytics(),
      ]);
      setOperations(ops);
      setAnalytics(analyticsData);
      setLiveEvents(deriveEvents(ops));
    } catch (err: any) {
      setError(err?.message || 'Failed to load command center data');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Listen for socket events to update live feed
  useEffect(() => {
    const handleTradeUpdate = (data: any) => {
      // Refresh data when trade updates come in
      fetchData();
    };

    socketService.on('trade:updated', handleTradeUpdate);
    socketService.on('offer:accepted', handleTradeUpdate);
    socketService.on('offer:new', handleTradeUpdate);

    return () => {
      socketService.off('trade:updated', handleTradeUpdate);
      socketService.off('offer:accepted', handleTradeUpdate);
      socketService.off('offer:new', handleTradeUpdate);
    };
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getEventBadgeVariant = (
    type: string
  ): 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold' => {
    switch (type) {
      case 'sale':
      case 'delivery':
        return 'success';
      case 'alert':
        return 'danger';
      case 'match':
        return 'info';
      default:
        return 'muted';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sale':
      case 'delivery':
        return <CheckCircle color={COLORS.accentGreen} size={16} />;
      case 'match':
        return <TrendingUp color={COLORS.accentGreen} size={16} />;
      case 'alert':
        return <AlertCircle color="#F87171" size={16} />;
      case 'transport':
        return <Truck color={COLORS.textSecondary} size={16} />;
      default:
        return <Package color={COLORS.textMuted} size={16} />;
    }
  };

  const getStatusIcon = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered') return <CheckCircle color={COLORS.accentGreen} size={15} />;
    if (s === 'in_transit' || s === 'transit') return <Truck color={COLORS.textSecondary} size={15} />;
    if (s === 'matched') return <TrendingUp color={COLORS.accentGreen} size={15} />;
    if (s === 'disputed') return <AlertCircle color="#F87171" size={15} />;
    return <Clock color={COLORS.textMuted} size={15} />;
  };

  const matchedCount = operations.filter(
    (o) => (o.status || '').toLowerCase() === 'matched' || (o.phase || '').toLowerCase() === 'matched'
  ).length;

  const activeCount = operations.filter(
    (o) =>
      !['completed', 'cancelled', 'refunded'].includes((o.status || '').toLowerCase())
  ).length;

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Loading command center..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Error"
          subtitle={error}
          cta="Retry"
          onPress={fetchData}
          icon={<AlertCircle size={32} color="#F87171" />}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.rootContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
      }
    >
      {/* Compact stats strip */}
      <GlassCard tier="subtle" style={styles.statsStrip} animate={false}>
        <View style={styles.statsInner}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{operations.length}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, styles.statValueGreen]}>{matchedCount}</Text>
            <Text style={styles.statLabel}>MATCHED</Text>
          </View>
        </View>
      </GlassCard>

      <View style={styles.cardsRow}>
        {/* Order Overview */}
        <GlassCard tier="medium" style={styles.halfCard} delay={80} noPadding>
          <View style={styles.sectionHeader}>
            <Package color={COLORS.accentGreen} size={16} />
            <Text style={styles.sectionTitle}>TRADE OPERATIONS</Text>
            <Text style={styles.sectionCount}>{operations.length}</Text>
          </View>
          <View style={DIVIDER} />
          {operations.length === 0 ? (
            <View style={styles.emptyPad}>
              <Text style={styles.emptyText}>No trade operations yet.</Text>
            </View>
          ) : (
            operations.slice(0, 8).map((op) => (
              <TouchableOpacity key={op.id} style={styles.rowItem} activeOpacity={0.7}>
                {getStatusIcon(op.status)}
                <View style={styles.rowText}>
                  <Text style={styles.rowId}>TRD-{op.id.slice(-4).toUpperCase()}</Text>
                  <Text style={styles.rowSub}>
                    {op.buyListing?.product?.name || 'Unknown'} — {op.buyListing?.quantity || 0}T
                  </Text>
                </View>
                <Text style={styles.goldPrice}>
                  {op._count?.sellers ?? 0} sellers
                </Text>
                <ArrowRight color={COLORS.textMuted} size={12} />
              </TouchableOpacity>
            ))
          )}
        </GlassCard>

        {/* Live Trade Events */}
        <GlassCard tier="medium" style={styles.halfCard} delay={140} noPadding>
          <View style={styles.sectionHeader}>
            <Bell color={COLORS.accentGreen} size={16} />
            <Text style={styles.sectionTitle}>LIVE TRADE EVENTS</Text>
            <View style={styles.liveIndicator} />
          </View>
          <View style={DIVIDER} />
          <ScrollView style={styles.eventScroll} showsVerticalScrollIndicator={false}>
            {liveEvents.length === 0 ? (
              <View style={styles.emptyPad}>
                <Text style={styles.emptyText}>No recent events.</Text>
              </View>
            ) : (
              liveEvents.map((event) => (
                <TouchableOpacity key={event.id} style={styles.eventRow} activeOpacity={0.7}>
                  {getEventIcon(event.type)}
                  <View style={styles.eventBody}>
                    <View style={styles.eventTopRow}>
                      <Text style={styles.eventTime}>{event.time}</Text>
                      <GlassBadge
                        label={event.type}
                        variant={getEventBadgeVariant(event.type)}
                        size="sm"
                      />
                    </View>
                    <Text style={styles.eventDesc}>
                      <Text style={styles.traderName}>{event.trader}</Text>
                      <Text style={styles.eventAction}> {event.action}</Text>
                    </Text>
                    <Text style={styles.eventLocation}>
                      {'\uD83D\uDCCD'} {event.location}
                      {event.buyer && (
                        <Text style={styles.buyerName}>
                          {' → '}
                          {event.buyer}
                        </Text>
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </GlassCard>
      </View>

      {/* Trade Volume Overview */}
      <GlassCard tier="medium" style={styles.chartCard} delay={200} noPadding>
        <View style={styles.sectionHeader}>
          <TrendingUp color={COLORS.accentGreen} size={16} />
          <Text style={styles.sectionTitle}>TRADE VOLUME OVERVIEW</Text>
          {analytics && (
            <Text style={styles.analyticsText}>
              {analytics.totalTrades} trades • avg margin {(analytics.averageMargin * 100).toFixed(1)}%
            </Text>
          )}
        </View>
        <View style={DIVIDER} />
        <View style={styles.chartArea}>
          <View style={styles.chartInner}>
            {analytics && analytics.marginDistribution.length > 0
              ? analytics.marginDistribution.slice(0, 12).map((margin, i) => {
                  const height = Math.max(10, Math.min(96, margin * 200));
                  return <View key={i} style={[styles.chartBar, { height }]} />;
                })
              : [60, 80, 50, 90, 70, 40, 85, 65].map((h, i) => (
                  <View key={i} style={[styles.chartBar, { height: h }]} />
                ))}
          </View>
          <View style={styles.yAxis}>
            <Text style={styles.axisLabel}>100%</Text>
            <Text style={styles.axisLabel}>75%</Text>
            <Text style={styles.axisLabel}>50%</Text>
            <Text style={styles.axisLabel}>25%</Text>
          </View>
          <View style={styles.xAxis}>
            <Text style={styles.axisLabel}>Recent Trades</Text>
            <Text style={styles.axisLabel}>Margin Distribution</Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  analyticsText: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  axisLabel: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 9,
  },
  buyerName: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  chartArea: {
    height: 180,
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  chartBar: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: 4,
    opacity: 0.85,
    width: 8,
  },
  chartCard: {},
  chartInner: {
    alignItems: 'flex-end',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  emptyPad: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
  },
  eventAction: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  eventBody: {
    flex: 1,
    gap: 3,
  },
  eventDesc: {
    fontSize: 12,
  },
  eventLocation: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  eventRow: {
    alignItems: 'flex-start',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  eventScroll: {
    maxHeight: 260,
  },
  eventTime: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  eventTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  goldPrice: {
    color: COLORS.accentGold,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  halfCard: {
    flex: 1,
    minWidth: 280,
  },
  liveIndicator: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  rootContent: {
    gap: 16,
    padding: 16,
    paddingBottom: 100,
  },
  rowId: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  rowItem: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowSub: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  rowText: {
    flex: 1,
  },
  sectionCount: {
    color: COLORS.accentGold,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
  },
  statDivider: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 32,
    width: 1,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '800',
  },
  statValueGreen: {
    color: COLORS.accentGreen,
  },
  statsInner: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statsStrip: {
    paddingVertical: 0,
  },
  traderName: {
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  xAxis: {
    bottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
  },
  yAxis: {
    bottom: 28,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    top: 8,
  },
});
