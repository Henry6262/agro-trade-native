import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

interface GlassBadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  size?: 'sm' | 'md';
  testID?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: 'rgba(74,222,128,0.15)', text: '#4ADE80', border: 'rgba(74,222,128,0.3)' },
  warning: {
    bg: 'rgba(255,255,255,0.07)',
    text: 'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.12)',
  },
  danger: { bg: 'rgba(248,113,113,0.12)', text: '#F87171', border: 'rgba(248,113,113,0.25)' },
  info: {
    bg: 'rgba(255,255,255,0.07)',
    text: 'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.12)',
  },
  muted: {
    bg: 'rgba(255,255,255,0.06)',
    text: 'rgba(255,255,255,0.45)',
    border: 'rgba(255,255,255,0.1)',
  },
  gold: {
    bg: 'rgba(255,255,255,0.07)',
    text: 'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.12)',
  },
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
    borderRadius: 20,
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
