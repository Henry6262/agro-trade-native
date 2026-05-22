import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// Checks connectivity with a lightweight HEAD request to a reliable endpoint.
// No native modules required — works in all Expo build types.
const checkOnline = async (): Promise<boolean> => {
  try {
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
};

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useSharedValue(-60);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const online = await checkOnline();
      if (!cancelled) {
        setIsOffline(!online);
        translateY.value = withTiming(!online ? 0 : -60, { duration: 300 });
      }
    };

    void check();
    const interval = setInterval(() => void check(), 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [translateY]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[styles.banner, animStyle]}
      // a11y fix: alert role for critical connectivity status
      accessibilityRole="alert"
      // a11y fix: assertive so screen readers announce immediately
      accessibilityLiveRegion="assertive"
      // a11y fix: explicit label for screen readers
      accessibilityLabel="You are offline. Changes will sync when reconnected."
    >
      <Text style={styles.text}>
        {"\u26A0\uFE0F You're offline \u2014 changes will sync when reconnected"}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(239,68,68,0.9)',
    left: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
