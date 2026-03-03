import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DollarSign, Calendar, Target, Award } from 'lucide-react-native';
import { StatCard, COLORS } from '../../../../../../../design-system';
import type { EarningsSummary } from '../types';

interface EarningsSummaryGridProps {
  summary: EarningsSummary;
  isMobile: boolean;
}

export const EarningsSummaryGrid: React.FC<EarningsSummaryGridProps> = ({ summary, isMobile }) => (
  <View style={[styles.grid, isMobile && styles.gridMobile]}>
    <StatCard
      label="Total Earnings"
      value={Math.round(summary.totalEarnings / 1000)}
      prefix="$"
      suffix="k"
      trend={{ value: summary.growthRate }}
      icon={<DollarSign color={COLORS.accentGreen} size={18} />}
      color={COLORS.accentGold}
      style={isMobile ? styles.cardMobile : styles.card}
      delay={0}
    />
    <StatCard
      label="This Month"
      value={Math.round(summary.monthlyEarnings / 1000)}
      prefix="$"
      suffix="k"
      icon={<Calendar color="#60A5FA" size={18} />}
      color="#60A5FA"
      style={isMobile ? styles.cardMobile : styles.card}
      delay={60}
    />
    <StatCard
      label="Trades"
      value={summary.completedTrades}
      icon={<Target color="#A78BFA" size={18} />}
      color="#A78BFA"
      style={isMobile ? styles.cardMobile : styles.card}
      delay={120}
    />
    <StatCard
      label="Top Product"
      value={0}
      icon={<Award color={COLORS.accentGold} size={18} />}
      color={COLORS.accentGold}
      style={isMobile ? styles.cardMobile : styles.card}
      delay={180}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  cardMobile: {
    marginBottom: 8,
    width: '48%',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  gridMobile: {
    flexWrap: 'wrap',
  },
});
