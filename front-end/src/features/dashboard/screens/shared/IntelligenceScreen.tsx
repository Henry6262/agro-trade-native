'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '../../../../design-system';
import { COLORS } from '../../../../design-system/tokens';
import { useMarketStore, PriceAlert } from '../../../../stores/market.store';
import { CommoditySymbol } from '../../../../services/marketDataService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntelligenceScreenProps {
  id?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatLastUpdated(timestamp: number): string {
  if (!timestamp) return 'never';
  return formatTimeAgo(new Date(timestamp).toISOString());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PriceTicker: React.FC = () => {
  const prices = useMarketStore((s) => s.prices);
  const isLoading = useMarketStore((s) => s.isLoadingPrices);

  if (isLoading && prices.length === 0) {
    return (
      <GlassCard tier="subtle" style={styles.tickerCard}>
        <ActivityIndicator color={COLORS.accentGreen} />
      </GlassCard>
    );
  }

  if (!isLoading && prices.length === 0) {
    return (
      <GlassCard tier="subtle" style={styles.tickerCard}>
        <Text style={styles.emptyText}>Unable to load prices</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard tier="subtle" noPadding style={styles.tickerCard}>
      <FlatList
        data={prices}
        horizontal
        keyExtractor={(item) => item.symbol}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tickerList}
        renderItem={({ item }) => {
          const isUp = item.change >= 0;
          const changeColor = isUp ? COLORS.accentGreen : COLORS.danger;
          const ChangeIcon = isUp ? TrendingUp : TrendingDown;

          return (
            <View style={styles.tickerItem}>
              <Text style={styles.tickerSymbol}>{item.symbol}</Text>
              <Text style={styles.tickerPrice}>${item.price.toFixed(2)}</Text>
              <View style={styles.tickerChange}>
                <ChangeIcon size={10} color={changeColor} />
                <Text style={[styles.tickerChangePct, { color: changeColor }]}>
                  {item.changePct > 0 ? '+' : ''}
                  {item.changePct.toFixed(1)}%
                </Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.tickerSeparator} />}
      />
    </GlassCard>
  );
};

const StatsStrip: React.FC = () => {
  const prices = useMarketStore((s) => s.prices);
  const alerts = useMarketStore((s) => s.alerts);
  const lastPriceFetch = useMarketStore((s) => s.lastPriceFetch);

  return (
    <View style={styles.statsStrip}>
      <Text style={styles.statItem}>
        <Text style={styles.statValue}>{prices.length}</Text>
        <Text style={styles.statLabel}> tracked</Text>
      </Text>
      <View style={styles.statDot} />
      <Text style={styles.statItem}>
        <Text style={styles.statValue}>{alerts.length}</Text>
        <Text style={styles.statLabel}> alerts</Text>
      </Text>
      <View style={styles.statDot} />
      <Text style={styles.statLabel}>{formatLastUpdated(lastPriceFetch)}</Text>
    </View>
  );
};

const NewsSection: React.FC = () => {
  const news = useMarketStore((s) => s.news);
  const isLoading = useMarketStore((s) => s.isLoadingNews);

  const openArticle = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      console.warn('[IntelligenceScreen] Could not open URL:', url);
    });
  }, []);

  return (
    <View>
      <Text style={styles.sectionTitle}>📰 LIVE NEWS</Text>

      {isLoading && news.length === 0 && (
        <GlassCard tier="subtle">
          <ActivityIndicator color={COLORS.accentGreen} />
        </GlassCard>
      )}

      {!isLoading && news.length === 0 && (
        <GlassCard tier="subtle">
          <Text style={styles.emptyText}>Check back soon</Text>
        </GlassCard>
      )}

      {news.map((article, index) => (
        <TouchableOpacity
          key={`${article.url}-${index}`}
          onPress={() => openArticle(article.url)}
          activeOpacity={0.75}
          style={styles.newsCardWrapper}
        >
          <GlassCard tier="subtle" animate delay={index * 40}>
            <View style={styles.newsCardHeader}>
              <GlassBadge label={article.source} variant="muted" />
              <Text style={styles.newsTime}>{formatTimeAgo(article.publishedAt)}</Text>
            </View>
            <Text style={styles.newsTitle} numberOfLines={2}>
              {article.title}
            </Text>
            {!!article.description && (
              <Text style={styles.newsDescription} numberOfLines={2}>
                {article.description}
              </Text>
            )}
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const COMMODITY_NAMES: Record<CommoditySymbol, string> = {
  WHEAT: 'Wheat',
  CORN: 'Corn',
  COTTON: 'Cotton',
  SUGAR: 'Sugar',
  COFFEE: 'Coffee',
  NATURAL_GAS: 'Gas',
};

const AlertsSection: React.FC = () => {
  const alerts = useMarketStore((s) => s.alerts);
  const prices = useMarketStore((s) => s.prices);
  const addAlert = useMarketStore((s) => s.addAlert);
  const removeAlert = useMarketStore((s) => s.removeAlert);

  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState<CommoditySymbol>('WHEAT');
  const [newCondition, setNewCondition] = useState<'above' | 'below'>('above');
  const [newThreshold, setNewThreshold] = useState('');

  const availableSymbols = prices.map((p) => p.symbol);
  const displaySymbols: CommoditySymbol[] =
    availableSymbols.length > 0
      ? availableSymbols
      : ['WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE', 'NATURAL_GAS'];

  const handleAdd = useCallback(() => {
    const threshold = parseFloat(newThreshold);
    if (!isNaN(threshold) && threshold > 0) {
      addAlert({ symbol: newSymbol, condition: newCondition, threshold });
      setNewThreshold('');
      setIsAdding(false);
    }
  }, [addAlert, newSymbol, newCondition, newThreshold]);

  return (
    <View>
      <Text style={styles.sectionTitle}>🔔 PRICE ALERTS ({alerts.length} active)</Text>

      {alerts.length === 0 && !isAdding && (
        <GlassCard tier="subtle">
          <Text style={styles.emptyText}>No alerts set. Tap below to add one.</Text>
        </GlassCard>
      )}

      {alerts.map((alert: PriceAlert) => (
        <GlassCard key={alert.id} tier="subtle" style={styles.alertCard}>
          <View style={styles.alertRow}>
            <View style={styles.alertLeft}>
              {alert.triggered ? (
                <Bell size={14} color={COLORS.accentGold} />
              ) : (
                <BellOff size={14} color={COLORS.textMuted} />
              )}
              <Text style={styles.alertText}>
                <Text style={styles.alertSymbol}>
                  {COMMODITY_NAMES[alert.symbol] ?? alert.symbol}
                </Text>{' '}
                {alert.condition}{' '}
                <Text style={styles.alertThreshold}>${alert.threshold.toFixed(2)}</Text>
              </Text>
              {alert.triggered && <GlassBadge label="TRIGGERED" variant="muted" />}
            </View>
            <TouchableOpacity onPress={() => removeAlert(alert.id)} hitSlop={8}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}

      {isAdding ? (
        <GlassCard tier="medium">
          <Text style={styles.addAlertLabel}>Commodity</Text>
          <View style={styles.symbolRow}>
            {displaySymbols.map((sym) => (
              <TouchableOpacity
                key={sym}
                style={[styles.symbolChip, newSymbol === sym && styles.symbolChipActive]}
                onPress={() => setNewSymbol(sym)}
              >
                <Text
                  style={[styles.symbolChipText, newSymbol === sym && styles.symbolChipTextActive]}
                >
                  {COMMODITY_NAMES[sym] ?? sym}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.addAlertLabel}>Condition</Text>
          <View style={styles.conditionRow}>
            {(['above', 'below'] as const).map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[styles.condChip, newCondition === cond && styles.condChipActive]}
                onPress={() => setNewCondition(cond)}
              >
                {cond === 'above' ? (
                  <ChevronUp
                    size={12}
                    color={newCondition === cond ? COLORS.accentGreen : COLORS.textMuted}
                  />
                ) : (
                  <ChevronDown
                    size={12}
                    color={newCondition === cond ? COLORS.danger : COLORS.textMuted}
                  />
                )}
                <Text
                  style={[
                    styles.condChipText,
                    newCondition === cond &&
                      (cond === 'above' ? styles.condChipTextUp : styles.condChipTextDown),
                  ]}
                >
                  {cond.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.addAlertLabel}>Threshold (USD)</Text>
          <View style={styles.thresholdRow}>
            <GlassButton
              label="Cancel"
              onPress={() => setIsAdding(false)}
              variant="ghost"
              size="sm"
            />
            <GlassButton label="Set Alert" onPress={handleAdd} variant="primary" size="sm" />
          </View>
        </GlassCard>
      ) : (
        <GlassButton
          label="+ Set new alert"
          onPress={() => setIsAdding(true)}
          variant="ghost"
          size="sm"
        />
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function IntelligenceScreen({ id: _id }: IntelligenceScreenProps = {}) {
  const fetchPrices = useMarketStore((s) => s.fetchPrices);
  const fetchNews = useMarketStore((s) => s.fetchNews);

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchPrices(), fetchNews()]);
  }, [fetchPrices, fetchNews]);

  const handleRefresh = useCallback(async () => {
    useMarketStore.setState({ lastPriceFetch: 0, lastNewsFetch: 0 });
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.accentGreen}
        />
      }
    >
      <PriceTicker />
      <StatsStrip />
      <NewsSection />
      <AlertsSection />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  addAlertLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  alertCard: {
    marginBottom: 6,
  },
  alertLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  alertRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertSymbol: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  alertText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  alertThreshold: {
    color: COLORS.accentGold,
    fontWeight: '700',
  },
  condChip: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  condChipActive: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  condChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  condChipTextDown: {
    color: COLORS.danger,
  },
  condChipTextUp: {
    color: COLORS.accentGreen,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 100,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  newsCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  newsCardWrapper: {
    marginBottom: 8,
  },
  newsDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  newsTime: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  newsTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statDot: {
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
    height: 3,
    width: 3,
  },
  statItem: {
    fontSize: 12,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  statsStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  symbolChip: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  symbolChipActive: {
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderColor: COLORS.accentGreen,
  },
  symbolChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  symbolChipTextActive: {
    color: COLORS.accentGreen,
  },
  symbolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  tickerCard: {
    overflow: 'hidden',
  },
  tickerChange: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  tickerChangePct: {
    fontSize: 10,
    fontWeight: '600',
  },
  tickerItem: {
    alignItems: 'center',
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tickerList: {
    paddingHorizontal: 4,
  },
  tickerPrice: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  tickerSeparator: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: '60%',
    width: 1,
  },
  tickerSymbol: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
