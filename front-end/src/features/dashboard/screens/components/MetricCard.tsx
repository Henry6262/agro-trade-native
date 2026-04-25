import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseComponentProps } from '@shared/types';
import { GlassCard } from '@design-system';
import { COLORS } from '@design-system';

interface MetricCardProps extends BaseComponentProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  gradient?: string;
  borderColor?: string;
  iconColor?: string;
  valueColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = COLORS.info,
  valueColor,
  testID,
  accessibilityLabel,
}) => {
  const resolvedValueColor = valueColor ? resolveValueColor(valueColor) : COLORS.accentGold;

  return (
    <GlassCard
      tier="subtle"
      animate={false}
      style={styles.card}
      testID={testID}
      accessibilityLabel={accessibilityLabel || `${title}: ${value}`}
    >
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, { color: resolvedValueColor }]}>{value}</Text>
        </View>
        <View style={styles.iconWrap}>
          <Icon size={20} color={iconColor} />
        </View>
      </View>
    </GlassCard>
  );
};

/**
 * Maps legacy Tailwind color class strings (e.g. "text-blue-400") to
 * design-system token colors so callers that pass className-style
 * strings still get a valid color.
 */
function resolveValueColor(valueColor: string): string {
  if (!valueColor.startsWith('text-')) return valueColor;
  const map: Record<string, string> = {
    'text-blue-400': COLORS.info,
    'text-green-400': COLORS.accentGreen,
    'text-yellow-400': COLORS.accentGold,
    'text-red-400': COLORS.danger,
    'text-white': COLORS.textPrimary,
    'text-gray-400': COLORS.textMuted,
  };
  return map[valueColor] ?? COLORS.accentGold;
}

const styles = StyleSheet.create({
  card: {},
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  textBlock: { flex: 1 },
  title: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: { fontFamily: 'monospace', fontSize: 18, fontWeight: '800' },
});
