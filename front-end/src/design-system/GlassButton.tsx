import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GLASS, COLORS, ANIM, GRADIENT } from './tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const VARIANT_GRADIENTS: Record<string, readonly [string, string]> = {
  primary: GRADIENT.green,
  danger: ['#DC2626', '#F87171'] as const,
};

const DISABLED_GRADIENT: readonly [string, string] = ['#6B7280', '#9CA3AF'] as const;

export const GlassButton: React.FC<GlassButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  leftIcon,
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, ANIM.springStiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIM.spring);
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const sizeStyle = SIZE_STYLES[size];
  const isFullWidth = fullWidth ? { alignSelf: 'stretch' as const } : {};
  const usesGradient = variant === 'primary' || variant === 'danger';

  const content = (
    <>
      {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[styles.label, sizeStyle.label, VARIANT_TEXT[variant]]}>{label}</Text>
      )}
    </>
  );

  if (usesGradient) {
    const gradientColors = disabled
      ? DISABLED_GRADIENT
      : (VARIANT_GRADIENTS[variant] ?? GRADIENT.green);

    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading }}
        style={[animStyle, isFullWidth, { borderRadius: 12, overflow: 'hidden' }, style]}
      >
        <LinearGradient
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizeStyle.inner]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        animStyle,
        isFullWidth,
        {
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: variant === 'ghost' ? 'rgba(255,255,255,0.3)' : GLASS.medium.border,
          backgroundColor: variant === 'ghost' ? 'transparent' : GLASS.medium.fill,
        },
        style,
      ]}
    >
      <View style={[styles.inner, sizeStyle.inner]}>{content}</View>
    </AnimatedPressable>
  );
};

const SIZE_STYLES: Record<ButtonSize, { inner: ViewStyle; label: TextStyle }> = {
  sm: {
    inner: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
    label: { fontSize: 13 },
  },
  md: {
    inner: { paddingHorizontal: 20, paddingVertical: 13, minHeight: 46 },
    label: { fontSize: 15 },
  },
  lg: {
    inner: { paddingHorizontal: 28, paddingVertical: 16, minHeight: 56 },
    label: { fontSize: 17 },
  },
};

const VARIANT_TEXT: Record<ButtonVariant, TextStyle> = {
  primary: { color: '#FFFFFF' },
  secondary: { color: COLORS.textPrimary },
  ghost: { color: COLORS.textSecondary },
  danger: { color: '#FFFFFF' },
};

const styles = StyleSheet.create({
  gradient: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  inner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
