import React from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

interface AnimatedRoleCardProps {
  id: 'buyer' | 'seller' | 'transport';
  title: string;
  color: string;
  gradient: string[];
  imageSource: ImageSourcePropType;
  isSelected?: boolean;
  onPress: () => void;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CARD_H = 100;
const IMG_W = 130;
const IMG_H = 100;

const ROLE_ACCENT = {
  buyer: {
    bg: 'rgba(96,165,250,0.11)',
    border: 'rgba(96,165,250,0.55)',
    glow: '#60A5FA',
  },
  seller: {
    bg: 'rgba(74,222,128,0.11)',
    border: 'rgba(74,222,128,0.55)',
    glow: '#4ADE80',
  },
  transport: {
    bg: 'rgba(167,139,250,0.11)',
    border: 'rgba(167,139,250,0.55)',
    glow: '#A78BFA',
  },
};

export const AnimatedRoleCard: React.FC<AnimatedRoleCardProps> = ({
  id,
  title,
  isSelected = false,
  onPress,
  delay = 0,
  imageSource,
}) => {
  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);
  const pressed = useSharedValue(0);
  const selected = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 14, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 380 });
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  React.useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, { damping: 14, stiffness: 140 });
  }, [isSelected, selected]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const pressScale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    const selectedScale = interpolate(selected.value, [0, 1], [1, 1.015]);
    return {
      transform: [{ scale: scale.value * pressScale * selectedScale }],
      opacity: opacity.value,
    };
  });

  const accent = ROLE_ACCENT[id];
  const cardBg = isSelected ? accent.bg : 'rgba(255,255,255,0.07)';
  const cardBorder = isSelected ? accent.border : 'rgba(255,255,255,0.1)';

  return (
    <AnimatedPressable
      style={[cardAnimatedStyle, styles.wrapper]}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 15, stiffness: 200 });
      }}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            ...(isSelected && {
              shadowColor: accent.glow,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10,
            }),
          },
        ]}
      >
        {/* Left: title only */}
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <View style={[styles.dot, { backgroundColor: accent.glow }]} />
            <Text style={styles.titleText}>{title}</Text>
            {isSelected && (
              <View style={[styles.checkBadge, { backgroundColor: accent.glow }]}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: character image — inside the card, anchored to bottom-right */}
        <View style={styles.imageWrapper}>
          <Image source={imageSource} style={styles.image} resizeMode="contain" />
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    height: CARD_H,
    overflow: 'hidden',
    position: 'relative',
  },
  checkBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginLeft: 8,
    width: 20,
  },
  checkText: { color: '#052e16', fontSize: 11, fontWeight: '800' },
  dot: {
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  image: {
    height: IMG_H,
    width: IMG_W,
  },
  imageWrapper: {
    bottom: 0,
    position: 'absolute',
    right: 0,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: IMG_W + 8,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  wrapper: {
    marginBottom: 12,
  },
});
