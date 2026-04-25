import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { GlassCard, COLORS } from '@design-system';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  // Backward compatibility for generic tailwind props if needed
  gradient?: string;
  borderColor?: string;
  valueColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = COLORS.accentGreen,
}) => {
  return (
    <GlassCard tier="subtle" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Icon size={16} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: iconColor }]}>{value}</Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
});
