import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GlassCard } from './GlassCard';
import { AnimatedCounter } from './AnimatedCounter';
import { GlassBadge } from './GlassBadge';
import { COLORS } from './tokens';

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: { value: number; label?: string };
  icon?: React.ReactNode;
  color?: string;
  style?: ViewStyle;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  prefix,
  suffix,
  trend,
  icon,
  color = COLORS.accentGold,
  style,
  delay = 0,
}) => {
  const trendPositive = trend && trend.value >= 0;

  return (
    <GlassCard tier="medium" style={style} delay={delay}>
      <View style={styles.header}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text style={styles.label}>{label.toUpperCase()}</Text>
      </View>
      <AnimatedCounter
        value={value}
        prefix={prefix}
        suffix={suffix}
        color={color}
        style={styles.value}
      />
      {trend && (
        <GlassBadge
          label={`${trendPositive ? '+' : ''}${trend.value}${trend.label ?? '%'}`}
          variant={trendPositive ? 'success' : 'danger'}
          style={styles.trend}
        />
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  iconWrap: {
    marginRight: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  trend: {
    marginTop: 6,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
  },
});
