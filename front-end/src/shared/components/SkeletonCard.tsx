// src/shared/components/SkeletonCard.tsx
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonCardProps {
  lines?: number;
  height?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3, height = 80 }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 700 }), withTiming(0.3, { duration: 700 })),
      -1,
      false
    );
    return () => cancelAnimation(opacity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const cardStyle = useMemo(() => [styles.card, { height }], [height]);

  return (
    <Animated.View style={[cardStyle, animStyle]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          style={[styles.line, i === lines - 1 && styles.lineShort]}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-evenly',
    marginBottom: 12,
    padding: 16,
  },
  line: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    height: 12,
    width: '100%',
  },
  lineShort: {
    width: '60%',
  },
});
