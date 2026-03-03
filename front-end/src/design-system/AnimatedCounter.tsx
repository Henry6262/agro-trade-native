import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import { COLORS } from './tokens';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle;
  color?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1200,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  color = COLORS.accentGold,
}) => {
  const [display, setDisplay] = React.useState('0');

  useEffect(() => {
    const startTime = Date.now();
    const startVal = 0;
    const endVal = value;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplay(current.toFixed(decimals));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [value, duration, decimals]);

  return (
    <Text style={[{ color, fontWeight: '700' }, style]}>
      {prefix}
      {display}
      {suffix}
    </Text>
  );
};
