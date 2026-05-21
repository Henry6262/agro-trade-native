import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wheat,
  Beef,
  Flower,
  BarChart3,
  Activity,
  Bell,
} from 'lucide-react-native';
import { GlassCard, COLORS, GLASS } from '../../../design-system';
import { MotiView } from 'moti';

/* ─── Helpers ─── */

function MiniSparkline({ data, color, up }: { data: number[]; color: string; up: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <View style={styles.sparklineRow}>
      {data.map((v, i) => {
        const h = ((v - min) / range) * 24 + 4;
        return (
          <MotiView
            key={i}
            from={{ height: 0, opacity: 0 }}
            animate={{ height: h, opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 200 + i * 60 }}
            style={[styles.sparkBar, { backgroundColor: color }]}
          />
        );
      })}
      <View style={styles.sparkArrowWrap}>
        {up ? <TrendingUp size={14} color={color} /> : <TrendingDown size={14} color={color} />}
      </View>
    </View>
  );
}

function SeverityPill({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: COLORS.danger,
    medium: COLORS.accentGold,
    low: COLORS.info,
  };
  const c = colors[level];
  return (
    <View style={[styles.severityPill, { backgroundColor: `${c}22`, borderColor: `${c}40` }]}>
      <View style={[styles.severityDot, { backgroundColor: c }]} />
      <Text style={[styles.severityText, { color: c }]}>{level.toUpperCase()}</Text>
    </View>
  );
}

/* ─── Data ─── */

const PRICE_SNAPSHOTS = [
  {
    product: 'Hard Red Winter Wheat',
    price: 218,
    change: +3.2,
    unit: 'USD/ton',
    trend: 'up' as const,
    icon: Wheat,
    spark: [210, 212, 208, 214, 211, 215, 218],
  },
  {
    product: 'Sunflower Seeds',
    price: 445,
    change: -1.8,
    unit: 'USD/ton',
    trend: 'down' as const,
    icon: Flower,
    spark: [460, 455, 458, 450, 448, 452, 445],
  },
  {
    product: 'Corn Feed Grade',
    price: 198,
    change: +0.5,
    unit: 'USD/ton',
    trend: 'up' as const,
    icon: BarChart3,
    spark: [194, 196, 195, 197, 196, 198, 198],
  },
  {
    product: 'Barley Malt',
    price: 267,
    change: -0.2,
    unit: 'USD/ton',
    trend: 'down' as const,
    icon: Beef,
    spark: [270, 268, 269, 267, 268, 266, 267],
  },
];

const ALERTS = [
  {
    level: 'high' as const,
    title: 'Drought risk in SE Bulgaria',
    desc: 'Rainfall 40% below seasonal average. Sunflower yield forecasts revised -8%.',
    metric: '-8% yield',
    metricColor: COLORS.danger,
  },
  {
    level: 'medium' as const,
    title: 'Greek import demand rising',
    desc: 'Thessaloniki mills increased wheat procurement by 15% MoM.',
    metric: '+15% MoM',
    metricColor: COLORS.accentGreen,
  },
  {
    level: 'low' as const,
    title: 'New EU grain subsidy cycle',
    desc: 'CAP 2026 direct payments open for registration until June 15.',
    metric: 'Jun 15',
    metricColor: COLORS.info,
  },
];

const TRENDS = [
  { label: 'Wheat exports BG→GR', value: '+12%', up: true },
  { label: 'Storage utilization', value: '87%', up: true },
  { label: 'Avg transport time', value: '-6%', up: true },
  { label: 'Input costs (fertilizer)', value: '+4%', up: false },
];

/* ─── Component ─── */

export default function IntelligenceScreen() {
  return (
    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <MotiView from={{ opacity: 0, translateY: -12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500 }}>
          <Text style={styles.header}>Market Intelligence</Text>
          <Text style={styles.subheader}>Live price feeds & risk alerts</Text>
        </MotiView>

        {/* Trend pills */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 100 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendScroll} contentContainerStyle={styles.trendContent}>
            {TRENDS.map((t, i) => (
              <View key={i} style={[styles.trendPill, { borderColor: t.up ? `${COLORS.accentGreen}30` : `${COLORS.danger}30` }]}>
                <Activity size={12} color={t.up ? COLORS.accentGreen : COLORS.danger} />
                <Text style={styles.trendLabel}>{t.label}</Text>
                <Text style={[styles.trendValue, { color: t.up ? COLORS.accentGreen : COLORS.danger }]}>{t.value}</Text>
              </View>
            ))}
          </ScrollView>
        </MotiView>

        {/* Price Snapshot */}
        <Text style={styles.sectionTitle}>Price Snapshot</Text>
        <View style={styles.priceList}>
          {PRICE_SNAPSHOTS.map((p, i) => {
            const Icon = p.icon;
            const color = p.trend === 'up' ? COLORS.accentGreen : COLORS.danger;
            return (
              <MotiView
                key={i}
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 150 + i * 70 }}
              >
                <GlassCard tier="medium" style={styles.priceCard} delay={i * 50}>
                  <View style={styles.priceRow}>
                    <View style={styles.priceLeft}>
                      <View style={styles.priceProductRow}>
                        <View style={[styles.priceIconWrap, { backgroundColor: `${color}15` }]}>
                          <Icon size={16} color={color} />
                        </View>
                        <View>
                          <Text style={styles.priceProduct}>{p.product}</Text>
                          <Text style={styles.priceUnit}>{p.unit}</Text>
                        </View>
                      </View>
                      <MiniSparkline data={p.spark} color={color} up={p.trend === 'up'} />
                    </View>
                    <View style={styles.priceRight}>
                      <Text style={[styles.priceValue, { color }]}>${p.price}</Text>
                      <View style={styles.changeRow}>
                        {p.trend === 'up' ? (
                          <TrendingUp size={12} color={COLORS.accentGreen} />
                        ) : (
                          <TrendingDown size={12} color={COLORS.danger} />
                        )}
                        <Text style={[styles.priceChange, { color }]}>
                          {p.change > 0 ? '+' : ''}
                          {p.change}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </MotiView>
            );
          })}
        </View>

        {/* Risk Alerts */}
        <View style={styles.alertHeaderRow}>
          <Text style={styles.sectionTitle}>Risk Alerts</Text>
          <View style={styles.alertBadge}>
            <Bell size={10} color={COLORS.textPrimary} />
            <Text style={styles.alertBadgeText}>{ALERTS.length}</Text>
          </View>
        </View>
        {ALERTS.map((alert, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 300 + i * 80 }}
          >
            <GlassCard tier="subtle" style={styles.alertCard} delay={i * 60}>
              <View style={styles.alertTop}>
                <View style={styles.alertTitleRow}>
                  <AlertTriangle
                    size={14}
                    color={
                      alert.level === 'high'
                        ? COLORS.danger
                        : alert.level === 'medium'
                        ? COLORS.accentGold
                        : COLORS.info
                    }
                  />
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                </View>
                <SeverityPill level={alert.level} />
              </View>
              <Text style={styles.alertDesc}>{alert.desc}</Text>
              <View style={[styles.alertMetric, { backgroundColor: `${alert.metricColor}18` }]}>
                <Text style={[styles.alertMetricText, { color: alert.metricColor }]}>{alert.metric}</Text>
              </View>
            </GlassCard>
          </MotiView>
        ))}
      </ScrollView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  subheader: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 18 },

  trendScroll: { marginBottom: 20 },
  trendContent: { gap: 8, paddingRight: 8 },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  trendLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  trendValue: { fontSize: 12, fontWeight: '800' },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  priceList: { gap: 10, marginBottom: 24 },
  priceCard: { padding: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLeft: { flex: 1, marginRight: 12 },
  priceProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  priceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceProduct: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 1 },
  priceUnit: { color: COLORS.textMuted, fontSize: 11 },
  priceRight: { alignItems: 'flex-end', minWidth: 60 },
  priceValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  priceChange: { fontSize: 12, fontWeight: '800' },

  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 30,
  },
  sparkBar: {
    width: 5,
    borderRadius: 2,
    opacity: 0.85,
  },
  sparkArrowWrap: {
    marginLeft: 4,
    justifyContent: 'flex-end',
    height: 30,
    paddingBottom: 2,
  },

  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.accentGold}22`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 12,
  },
  alertBadgeText: {
    color: COLORS.accentGold,
    fontSize: 11,
    fontWeight: '800',
  },

  alertCard: { padding: 14, marginBottom: 10 },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 10 },
  alertTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800', flex: 1, lineHeight: 18 },
  alertDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 10 },

  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  alertMetric: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertMetricText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
