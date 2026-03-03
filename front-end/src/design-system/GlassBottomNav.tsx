import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from './tokens';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
}

interface GlassBottomNavProps {
  activeId: string;
  items: NavItem[];
  onSelect: (id: string) => void;
}

interface AnimatedTabProps {
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  item: NavItem;
  onPress: (id: string) => void;
}

const AnimatedTab: React.FC<AnimatedTabProps> = ({ item, isActive, isFirst, isLast, onPress }) => {
  const Icon = item.icon;
  const progress = useSharedValue(isActive ? 1 : 0);
  const scale = useSharedValue(isActive ? 1.06 : 1);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 220 });
    scale.value = withSpring(isActive ? 1.06 : 1, { damping: 14, stiffness: 220 });
  }, [isActive, progress, scale]);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(74,222,128,0)', 'rgba(74,222,128,0.14)']
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(74,222,128,0)', 'rgba(74,222,128,0.25)']
    ),
    borderWidth: 1,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    position: 'absolute',
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], ['rgba(255,255,255,0.38)', COLORS.accentGreen]),
  }));

  return (
    <TouchableOpacity
      style={[styles.tab, isFirst && styles.tabFirst, isLast && styles.tabLast]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.tabInner, bgStyle]}>
        <Animated.View style={scaleStyle}>
          <View style={styles.iconContainer}>
            <Animated.View style={inactiveIconStyle}>
              <Icon size={24} color="rgba(255,255,255,0.4)" />
            </Animated.View>
            <Animated.View style={[styles.iconAbsolute, activeIconStyle]}>
              <Icon size={24} color={COLORS.accentGreen} />
            </Animated.View>
          </View>
        </Animated.View>
        <Animated.Text style={[styles.tabLabel, labelStyle]} numberOfLines={1}>
          {item.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const GlassBottomNav: React.FC<GlassBottomNavProps> = ({ items, activeId, onSelect }) => {
  const insets = useSafeAreaInsets();
  const displayItems = items.slice(0, 5);

  const handlePress = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(id);
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom : 4 }]}>
      <View style={styles.pill}>
        {displayItems.map((item, index) => (
          <AnimatedTab
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            isFirst={index === 0}
            isLast={index === displayItems.length - 1}
            onPress={handlePress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconAbsolute: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  iconContainer: {
    height: 24,
    width: 24,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,20,10,0.92)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 44,
    borderWidth: 1.5,
    elevation: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    width: '100%',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  tabFirst: {
    borderBottomLeftRadius: 34,
    borderTopLeftRadius: 34,
  },
  tabInner: {
    alignItems: 'center',
    borderRadius: 36,
    paddingHorizontal: 8,
    paddingVertical: 10,
    width: '100%',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
  },
  tabLast: {
    borderBottomRightRadius: 34,
    borderTopRightRadius: 34,
  },
  wrapper: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 4,
    position: 'absolute',
    right: 0,
  },
});
