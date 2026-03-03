import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Bell,
  TrendingUp,
  Package,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react-native';
import { GlassCard, GlassBadge } from '../../../../design-system';
import { COLORS } from '../../../../design-system';

const DIVIDER = { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 6 };

export default function CommandCenterScreen() {
  const orders = [
    {
      id: 'ORD-4821',
      product: 'WHEAT (GRADE A) - 50 TONS',
      status: 'active',
      price: '$282/ton',
      icon: Clock,
    },
    {
      id: 'ORD-4819',
      product: 'CORN (NON-GMO) - 25 TONS',
      status: 'matched',
      price: '$318/ton',
      icon: CheckCircle,
    },
    {
      id: 'ORD-4815',
      product: 'BASMATI RICE - 100 TONS',
      status: 'active',
      price: '$455/ton',
      icon: Clock,
    },
    {
      id: 'ORD-4812',
      product: 'SOYBEANS (ORGANIC) - 75 TONS',
      status: 'transit',
      price: '$384/ton',
      icon: Truck,
    },
  ];

  const tradeEvents = [
    {
      time: '2 min ago',
      type: 'sale',
      trader: 'Green Valley Farms',
      action: 'completed sale of 50T wheat',
      location: 'Iowa, USA',
      buyer: 'Fresh Market Co',
      icon: CheckCircle,
    },
    {
      time: '5 min ago',
      type: 'match',
      trader: 'Sunrise Orchards',
      action: 'order matched for 25T corn',
      location: 'California, USA',
      buyer: 'Global Food Distributors',
      icon: TrendingUp,
    },
    {
      time: '12 min ago',
      type: 'alert',
      trader: 'Prairie Wheat Co',
      action: 'transport delayed — weather hold',
      location: 'Kansas, USA',
      buyer: null,
      icon: AlertCircle,
    },
    {
      time: '18 min ago',
      type: 'listing',
      trader: 'Restaurant Supply Chain',
      action: 'listed 100T basmati rice order',
      location: 'Los Angeles, CA',
      buyer: null,
      icon: Package,
    },
    {
      time: '25 min ago',
      type: 'sale',
      trader: 'AgriLogistics Pro',
      action: 'delivery completed',
      location: 'Florida, USA',
      buyer: 'Global Food Distributors',
      icon: CheckCircle,
    },
    {
      time: '32 min ago',
      type: 'transport',
      trader: 'Swift Transport LLC',
      action: 'pickup scheduled',
      location: 'Texas → Chicago',
      buyer: null,
      icon: Truck,
    },
  ];

  const getEventBadgeVariant = (
    type: string
  ): 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold' => {
    switch (type) {
      case 'sale':
      case 'delivery':
        return 'success'; // green — only completed positive actions
      default:
        return 'muted'; // everything else: quiet white glass
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case 'active':
        return COLORS.accentGreen;
      case 'matched':
        return COLORS.accentGreen;
      case 'transit':
        return COLORS.textSecondary;
      default:
        return COLORS.textMuted;
    }
  };

  const getEventIconColor = (type: string) => {
    switch (type) {
      case 'sale':
      case 'delivery':
        return COLORS.accentGreen;
      default:
        return COLORS.textMuted;
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.rootContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Compact stats strip */}
      <GlassCard tier="subtle" style={styles.statsStrip} animate={false}>
        <View style={styles.statsInner}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>51</Text>
            <Text style={styles.statLabel}>SELL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>68</Text>
            <Text style={styles.statLabel}>BUY</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, styles.statValueGreen]}>27</Text>
            <Text style={styles.statLabel}>MATCHED</Text>
          </View>
        </View>
      </GlassCard>

      <View style={styles.cardsRow}>
        {/* Order Overview */}
        <GlassCard tier="medium" style={styles.halfCard} delay={80} noPadding>
          <View style={styles.sectionHeader}>
            <Package color={COLORS.accentGreen} size={16} />
            <Text style={styles.sectionTitle}>ORDER OVERVIEW</Text>
          </View>
          <View style={DIVIDER} />
          {orders.map((order) => {
            const IconComponent = order.icon;
            return (
              <TouchableOpacity key={order.id} style={styles.rowItem} activeOpacity={0.7}>
                <IconComponent color={getIconColor(order.status)} size={15} />
                <View style={styles.rowText}>
                  <Text style={styles.rowId}>{order.id}</Text>
                  <Text style={styles.rowSub}>{order.product}</Text>
                </View>
                <Text style={styles.goldPrice}>{order.price}</Text>
                <ArrowRight color={COLORS.textMuted} size={12} />
              </TouchableOpacity>
            );
          })}
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
            {tradeEvents.map((event, index) => {
              const IconComponent = event.icon;
              return (
                <TouchableOpacity key={index} style={styles.eventRow} activeOpacity={0.7}>
                  <IconComponent color={getEventIconColor(event.type)} size={16} />
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
              );
            })}
          </ScrollView>
        </GlassCard>
      </View>

      {/* Trade Volume Overview */}
      <GlassCard tier="medium" style={styles.chartCard} delay={200} noPadding>
        <View style={styles.sectionHeader}>
          <TrendingUp color={COLORS.accentGreen} size={16} />
          <Text style={styles.sectionTitle}>TRADE VOLUME OVERVIEW</Text>
        </View>
        <View style={DIVIDER} />
        <View style={styles.chartArea}>
          {/* Simulated chart bars */}
          <View style={styles.chartInner}>
            {[96, 80, 88, 72, 76, 68, 80, 64].map((h, i) => (
              <View key={i} style={[styles.chartBar, { height: h }]} />
            ))}
          </View>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.axisLabel}>500T</Text>
            <Text style={styles.axisLabel}>400T</Text>
            <Text style={styles.axisLabel}>300T</Text>
            <Text style={styles.axisLabel}>200T</Text>
          </View>
          {/* X-axis labels */}
          <View style={styles.xAxis}>
            <Text style={styles.axisLabel}>Jan 26, 2026</Text>
            <Text style={styles.axisLabel}>Feb 26, 2026</Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 12,
    fontWeight: '700',
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
