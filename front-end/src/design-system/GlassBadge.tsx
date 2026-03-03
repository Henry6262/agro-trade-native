import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

interface GlassBadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: 'rgba(74,222,128,0.2)', text: '#4ADE80', border: 'rgba(74,222,128,0.4)' },
  warning: { bg: 'rgba(252,211,77,0.2)', text: '#FCD34D', border: 'rgba(252,211,77,0.4)' },
  danger: { bg: 'rgba(248,113,113,0.2)', text: '#F87171', border: 'rgba(248,113,113,0.4)' },
  info: { bg: 'rgba(96,165,250,0.2)', text: '#60A5FA', border: 'rgba(96,165,250,0.4)' },
  muted: {
    bg: 'rgba(255,255,255,0.08)',
    text: 'rgba(255,255,255,0.5)',
    border: 'rgba(255,255,255,0.12)',
  },
  gold: { bg: 'rgba(252,211,77,0.15)', text: '#FCD34D', border: 'rgba(252,211,77,0.3)' },
};

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  label,
  variant = 'muted',
  style,
  size = 'sm',
}) => {
  const v = VARIANT_STYLES[variant];
  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      <Text
        style={[styles.label, size === 'sm' ? styles.labelSm : styles.labelMd, { color: v.text }]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  labelMd: {
    fontSize: 12,
  },
  labelSm: {
    fontSize: 10,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
