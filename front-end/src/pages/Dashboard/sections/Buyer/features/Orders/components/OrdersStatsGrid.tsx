import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DollarSign, Calendar, CheckCircle, Award } from 'lucide-react-native';
import { StatCard, COLORS } from '../../../../../../../design-system';
import type { BuyerStatistics } from '../types';

interface OrdersStatsGridProps {
  stats: BuyerStatistics;
}

export const OrdersStatsGrid: React.FC<OrdersStatsGridProps> = ({ stats }) => (
  <View style={styles.grid}>
    <StatCard
      label="Total Spent"
      value={Math.round(stats.totalSpent / 1000)}
      prefix="$"
      suffix="k"
      trend={{ value: -stats.savingsRate }}
      icon={<DollarSign color={COLORS.info} size={18} />}
      color={COLORS.accentGold}
      style={styles.card}
      delay={0}
    />
    <StatCard
      label="This Month"
      value={Math.round(stats.monthlySpent / 1000)}
      prefix="$"
      suffix="k"
      icon={<Calendar color={COLORS.accentGreen} size={18} />}
      color={COLORS.accentGold}
      style={styles.card}
      delay={60}
    />
    <StatCard
      label="Completed"
      value={stats.completedOrders}
      icon={<CheckCircle color="#FCD34D" size={18} />}
      color={COLORS.accentGreen}
      style={styles.card}
      delay={120}
    />
    <StatCard
      label="Top Product"
      value={0}
      icon={<Award color="#A78BFA" size={18} />}
      color="#A78BFA"
      style={styles.card}
      delay={180}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
});
