import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, Wheat, MapPin, TrendingUp, DollarSign } from 'lucide-react-native';
import {
  GradientBackground,
  GlassCard,
  GlassBadge,
  StatCard,
  COLORS,
} from '@design-system';
import {
  impactService,
  PlatformImpact,
  CommodityBreakdownItem,
  RegionalHeatmapItem,
} from '../../../../services/impactService';

export const ImpactScreen: React.FC = () => {
  const [impact, setImpact] = useState<PlatformImpact | null>(null);
  const [commodities, setCommodities] = useState<CommodityBreakdownItem[]>([]);
  const [regions, setRegions] = useState<RegionalHeatmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [impactData, commodityData, regionData] = await Promise.all([
        impactService.getPlatformImpact(),
        impactService.getCommodityBreakdown(),
        impactService.getRegionalHeatmap(),
      ]);
      setImpact(impactData);
      setCommodities(commodityData);
      setRegions(regionData);
    } catch {
      // Data not available yet - show zeros
      setImpact({
        totalTrades: 0,
        totalVolumeKg: 0,
        uniqueFarmers: 0,
        regionsActive: 0,
        estimatedIncomeGenerated: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <ActivityIndicator color={COLORS.accentGreen} size="large" style={styles.loader} />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const maxVolume = Math.max(...commodities.map((c) => c.totalVolumeKg), 1);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accentGreen}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Platform Impact</Text>
            <Text style={styles.headerSubtitle}>EU Grant Reporting Dashboard</Text>
          </View>

          {/* Key Metrics */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Trades Completed"
              value={impact?.totalTrades ?? 0}
              icon={<BarChart3 size={18} color={COLORS.accentGreen} />}
              color={COLORS.accentGreen}
              style={styles.statCard}
            />
            <StatCard
              label="Volume (tonnes)"
              value={Math.round((impact?.totalVolumeKg ?? 0) / 1000)}
              suffix="t"
              icon={<Wheat size={18} color={COLORS.accentGold} />}
              color={COLORS.accentGold}
              style={styles.statCard}
            />
            <StatCard
              label="Farmers Reached"
              value={impact?.uniqueFarmers ?? 0}
              icon={<TrendingUp size={18} color="#60A5FA" />}
              color="#60A5FA"
              style={styles.statCard}
            />
            <StatCard
              label="Active Regions"
              value={impact?.regionsActive ?? 0}
              icon={<MapPin size={18} color="#A78BFA" />}
              color="#A78BFA"
              style={styles.statCard}
            />
          </View>

          {/* Income Estimate */}
          <GlassCard tier="medium" style={styles.incomeCard}>
            <View style={styles.incomeRow}>
              <DollarSign size={24} color={COLORS.accentGreen} />
              <View style={styles.incomeText}>
                <Text style={styles.incomeLabel}>Estimated Farmer Income Generated</Text>
                <Text style={styles.incomeValue}>
                  €
                  {(impact?.estimatedIncomeGenerated ?? 0).toLocaleString('en-EU', {
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Commodity Breakdown */}
          {commodities.length > 0 && (
            <GlassCard tier="subtle" style={styles.section}>
              <Text style={styles.sectionTitle}>Top Commodities</Text>
              {commodities.slice(0, 5).map((item, idx) => (
                <View key={idx} style={styles.commodityRow}>
                  <Text style={styles.commodityCode}>{item.commodityCode ?? 'N/A'}</Text>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(item.totalVolumeKg / maxVolume) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.commodityVol}>{Math.round(item.totalVolumeKg / 1000)}t</Text>
                </View>
              ))}
            </GlassCard>
          )}

          {/* Regional Coverage */}
          {regions.length > 0 && (
            <GlassCard tier="subtle" style={styles.section}>
              <Text style={styles.sectionTitle}>Regional Coverage</Text>
              {regions.slice(0, 8).map((item, idx) => (
                <View key={idx} style={styles.regionRow}>
                  <MapPin size={14} color={COLORS.accentGreen} />
                  <Text style={styles.regionCode}>{item.regionCode ?? 'Unknown'}</Text>
                  <GlassBadge label={`${item.eventCount} events`} variant="success" size="sm" />
                </View>
              ))}
            </GlassCard>
          )}

          {/* Grant Info */}
          <GlassCard tier="subtle" style={styles.grantSection}>
            <Text style={styles.grantTitle}>EU Grant Alignment</Text>
            <Text style={styles.grantText}>
              This dashboard demonstrates measurable social impact for Horizon Europe, EAFRD, and
              EIC Accelerator grant applications.
            </Text>
            <View style={styles.grantBadges}>
              <GlassBadge label="Horizon Europe" variant="info" size="sm" />
              <GlassBadge label="EAFRD" variant="info" size="sm" />
              <GlassBadge label="EIC Accelerator" variant="info" size="sm" />
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  commodityCode: {
    color: COLORS.textSecondary,
    fontSize: 12,
    width: 60,
  },
  commodityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  commodityVol: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'right',
    width: 32,
  },
  container: {
    flex: 1,
  },
  grantBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  grantSection: {
    gap: 10,
    marginBottom: 0,
  },
  grantText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  grantTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  header: {
    marginBottom: 20,
    paddingTop: 8,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  incomeCard: {
    marginBottom: 16,
  },
  incomeLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  incomeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  incomeText: {
    flex: 1,
  },
  incomeValue: {
    color: COLORS.accentGreen,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  loader: {
    alignSelf: 'center',
    flex: 1,
  },
  progressBg: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: 3,
    height: '100%',
  },
  regionCode: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  regionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
});

export default ImpactScreen;
