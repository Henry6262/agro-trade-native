import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  onAnimationComplete?: () => void;
  formatValue?: (value: number) => string;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2000,
  suffix = '',
  prefix = '',
  className = 'text-4xl font-bold text-gray-900',
  onAnimationComplete,
  formatValue,
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(
      value,
      { duration },
      (isFinished) => {
        if (isFinished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      }
    );
  }, [value, duration, animatedValue, onAnimationComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentValue = Math.floor(animatedValue.value);
    const displayValue = formatValue ? formatValue(currentValue) : currentValue.toString();
    
    return {
      opacity: interpolate(animatedValue.value, [0, value * 0.1, value], [0, 1, 1]),
      transform: [
        {
          scale: interpolate(
            animatedValue.value,
            [0, value * 0.8, value],
            [0.8, 1.1, 1]
          ),
        },
      ],
    };
  });

  const animatedProps = useAnimatedStyle(() => {
    const currentValue = Math.floor(animatedValue.value);
    const displayValue = formatValue ? formatValue(currentValue) : currentValue.toString();
    
    return {
      text: `${prefix}${displayValue}${suffix}`,
    } as any;
  });

  return (
    <AnimatedText
      className={className}
      style={animatedStyle}
      // Note: In React Native, we need to handle text changes differently
      // This is a simplified version - in production you might need react-native-reanimated-text
    >
      {prefix}{formatValue ? formatValue(Math.floor(animatedValue.value || 0)) : Math.floor(animatedValue.value || 0)}{suffix}
    </AnimatedText>
  );
};

// Utility function to format large numbers
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Utility function to format currency
export const formatCurrency = (num: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};