import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GLASS } from './tokens';

interface GlassHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showWordmark?: boolean;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  showWordmark = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top || 44,
          backgroundColor: 'rgba(5,46,22,0.75)',
          borderBottomWidth: 1,
          borderBottomColor: GLASS.subtle.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>{leftAction}</View>
        <View style={styles.center}>
          {showWordmark ? (
            <Text style={styles.wordmark}>AGRO TRADE</Text>
          ) : title ? (
            <>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </>
          ) : null}
        </View>
        <View style={styles.right}>{rightAction}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 2,
  },
  container: {
    overflow: 'hidden',
    zIndex: 100,
  },
  left: {
    alignItems: 'flex-start',
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    flex: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  wordmark: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
});
