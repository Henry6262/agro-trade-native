import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GLASS, ANIM } from './tokens';

type GlassTier = 'subtle' | 'medium' | 'strong';

interface GlassCardProps {
  children: React.ReactNode;
  tier?: GlassTier;
  style?: ViewStyle;
  animate?: boolean;
  delay?: number;
  borderRadius?: number;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  tier = 'medium',
  style,
  animate = true,
  delay = 0,
  borderRadius = 16,
  noPadding = false,
}) => {
  const token = GLASS[tier];
  const translateY = useSharedValue(animate ? 24 : 0);
  const opacity = useSharedValue(animate ? 0 : 1);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withSpring(0, ANIM.spring);
      opacity.value = withTiming(1, { duration: 350 });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          borderRadius,
          backgroundColor: token.fill,
          borderWidth: 1,
          borderColor: token.border,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
    >
      <View style={[styles.content, noPadding && styles.noPadding]}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  noPadding: {
    padding: 0,
  },
});
