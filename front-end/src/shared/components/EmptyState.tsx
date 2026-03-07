// src/shared/components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassButton } from '../../design-system';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  cta,
  onPress,
}) => (
  <View style={styles.container}>
    {icon && <View style={styles.iconWrap}>{icon}</View>}
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {cta && onPress && (
      <GlassButton label={cta} onPress={onPress} variant="secondary" size="sm" style={styles.btn} />
    )}
  </View>
);

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
