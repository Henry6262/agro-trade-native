import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JobPriorityBadgeProps } from '@features/dashboard/screens/inspector/types';

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: '#ef4444', text: '#ffffff' },
  MEDIUM: { bg: '#eab308', text: '#000000' },
  LOW: { bg: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.8)' },
};

const DEFAULT_COLORS = { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' };

export const JobPriorityBadge: React.FC<JobPriorityBadgeProps> = ({
  priority,
  size = 'medium',
}) => {
  const colors = PRIORITY_COLORS[priority] ?? DEFAULT_COLORS;

  const sizeStyle =
    size === 'small' ? styles.small : size === 'large' ? styles.large : styles.medium;

  const fontSize = size === 'small' ? 11 : size === 'large' ? 14 : 12;

  const accessibilityText = `${priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()} priority job`;

  return (
    <View
      testID="priority-badge"
      style={[styles.badge, sizeStyle, { backgroundColor: colors.bg }]}
      accessibilityLabel={accessibilityText}
      accessibilityRole="text"
    >
      <Text style={[styles.text, { color: colors.text, fontSize }]}>{priority}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
