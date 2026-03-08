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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react-native';
import { AlertPill, NewsCard } from '../intelligence/components';
import { GlassCard, GlassButton, GlassInput } from '../../../../design-system';
import { formatTimeAgo } from '../../../../utils/formatTimeAgo';
import { COLORS, GLASS } from '../../../../design-system/tokens';
import { useMarketStore, PriceAlert } from '../../../../stores/market.store';
import { CommoditySymbol } from '../../../../services';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntelligenceScreenProps {
  id?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastUpdated(timestamp: number): string {
  if (!timestamp) return 'never';
  return formatTimeAgo(new Date(timestamp).toISOString());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonNewsCard: React.FC = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 700 }), withTiming(0.3, { duration: 700 })),
      -1,
      false
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.skeletonCard, animStyle]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLineFull} />
        <View style={styles.skeletonLineHalf} />
      </View>
    </Animated.View>
  );
};

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
              <Text style={styles.tickerPrice}>{item.price.toFixed(2)}</Text>
              <Text style={styles.tickerUnit}>
                {item.unit ? item.unit.split(' ').slice(-1)[0] : ''}
              </Text>
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
        <>
          <SkeletonNewsCard />
          <SkeletonNewsCard />
          <SkeletonNewsCard />
        </>
      )}

      {!isLoading && news.length === 0 && (
        <GlassCard tier="subtle">
          <Text style={styles.emptyText}>No agricultural news — pull to refresh</Text>
        </GlassCard>
      )}

      {news.map((article, index) => (
        <NewsCard key={article.url} article={article} onPress={openArticle} delay={index * 50} />
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
};

const COMMODITY_EMOJI: Record<CommoditySymbol, string> = {
  WHEAT: '🌾',
  CORN: '🌽',
  COTTON: '🪴',
  SUGAR: '🍬',
  COFFEE: '☕',
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
    availableSymbols.length > 0 ? availableSymbols : ['WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE'];

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
      {/* Header row: title left, + ADD button right */}
      <View style={styles.alertsHeader}>
        <Text style={styles.sectionTitleNoMargin}>🔔 PRICE ALERTS ({alerts.length} active)</Text>
        {!isAdding && (
          <GlassButton label="+ ADD" onPress={() => setIsAdding(true)} variant="ghost" size="sm" />
        )}
      </View>

      {/* Empty state */}
      {alerts.length === 0 && !isAdding && (
        <GlassCard tier="subtle">
          <View style={styles.alertsEmpty}>
            <Text style={styles.alertsEmptyIcon}>🔔</Text>
            <Text style={styles.alertsEmptyTitle}>No price alerts set</Text>
            <Text style={styles.alertsEmptySubtitle}>Tap + to monitor a commodity</Text>
          </View>
        </GlassCard>
      )}

      {/* Alert pill rows */}
      {alerts.map((alert: PriceAlert) => (
        <AlertPill key={alert.id} alert={alert} onRemove={removeAlert} />
      ))}

      {/* Add form */}
      {isAdding && (
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
                  {COMMODITY_EMOJI[sym]} {COMMODITY_NAMES[sym] ?? sym}
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
          <GlassInput
            placeholder="e.g. 7.50"
            value={newThreshold}
            onChangeText={setNewThreshold}
            keyboardType="decimal-pad"
            containerStyle={styles.thresholdInput}
          />
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
  alertsEmpty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  alertsEmptyIcon: {
    fontSize: 28,
  },
  alertsEmptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  alertsEmptyTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  alertsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  condChip: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.12)', // glass border muted
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  condChipActive: {
    borderColor: 'rgba(255,255,255,0.3)', // glass border active
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
  sectionTitleNoMargin: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 0,
    textTransform: 'uppercase',
  },
  skeletonBody: {
    gap: 8,
    padding: 12,
  },
  skeletonCard: {
    backgroundColor: GLASS.subtle.fill,
    borderColor: GLASS.subtle.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  skeletonImage: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    height: 140,
    width: '100%',
  },
  skeletonLineFull: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    height: 12,
    width: '90%',
  },
  skeletonLineHalf: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    height: 10,
    width: '60%',
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
    borderColor: 'rgba(255,255,255,0.12)', // glass border muted
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  symbolChipActive: {
    backgroundColor: 'rgba(74,222,128,0.14)', // COLORS.accentGreen at 14% opacity
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
  thresholdInput: {
    marginBottom: 0,
    marginTop: 4,
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
    backgroundColor: GLASS.subtle.fill, // matches rgba(255,255,255,0.08)
    height: '60%',
    width: 1,
  },
  tickerSymbol: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tickerUnit: {
    color: COLORS.textMuted,
    fontSize: 8,
    letterSpacing: 0.3,
    marginTop: 1,
  },
});
