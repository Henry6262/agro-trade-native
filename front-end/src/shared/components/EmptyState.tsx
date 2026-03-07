// src/shared/components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassButton } from '../../design-system';
import { BaseComponentProps } from '../types';

interface EmptyStateProps extends BaseComponentProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void;
  // Legacy backward-compat props
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  description,
  cta,
  onPress,
  actionLabel,
  onAction,
  testID,
  accessibilityLabel,
}) => {
  const subtitleText = subtitle ?? description;
  const ctaLabel = cta ?? actionLabel;
  const ctaPress = onPress ?? onAction;

  return (
    <View style={styles.container} testID={testID} accessibilityLabel={accessibilityLabel}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {subtitleText && <Text style={styles.subtitle}>{subtitleText}</Text>}
      {ctaLabel && ctaPress && (
        <GlassButton label={ctaLabel} onPress={ctaPress} variant="secondary" size="sm" style={styles.btn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    marginTop: 16,
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconWrap: {
    marginBottom: 16,
    opacity: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  title: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
