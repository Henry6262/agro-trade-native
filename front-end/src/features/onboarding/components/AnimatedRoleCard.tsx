import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedRoleCardProps {
  id: 'buyer' | 'seller' | 'transport';
  title: string;
  color: string;
  gradient: string[];
  imageSource: ImageSourcePropType;
  lottieSource?: any;
  isSelected?: boolean;
  onPress: () => void;
  delay?: number;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CARD_H = 108;
const IMG_W = 140;
const IMG_H = 108;

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
  lottieSource,
  index = 0,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const translateX = useSharedValue(index % 2 === 0 ? -40 : 40);
  const rotate = useSharedValue(index % 2 === 0 ? -4 : 4);
  const pressed = useSharedValue(0);
  const selected = useSharedValue(isSelected ? 1 : 0);
  const glow = useSharedValue(0);
  const float = useSharedValue(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 18, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 140 });
      translateX.value = withSpring(0, { damping: 18, stiffness: 140 });
      rotate.value = withSpring(0, { damping: 18, stiffness: 140 });
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, scale, opacity, translateY, translateX, rotate]);

  React.useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, { damping: 14, stiffness: 140 });
    glow.value = isSelected
      ? withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true)
      : withTiming(0, { duration: 300 });
    float.value = isSelected
      ? withRepeat(withTiming(-5, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true)
      : withSpring(0, { damping: 14, stiffness: 140 });
  }, [isSelected, selected, glow, float]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const pressScale = interpolate(pressed.value, [0, 1], [1, 0.96]);
    const selectedScale = interpolate(selected.value, [0, 1], [1, 1.03]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value * pressScale * selectedScale },
      ],
      opacity: opacity.value,
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(glow.value, [0, 1], [0.35, 0.75]);
    const glowRadius = interpolate(glow.value, [0, 1], [10, 22]);
    return {
      shadowOpacity: glowOpacity,
      shadowRadius: glowRadius,
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const accent = ROLE_ACCENT[id];
  const cardBg = isSelected ? accent.bg : 'rgba(255,255,255,0.07)';
  const cardBorder = isSelected ? accent.border : 'rgba(255,255,255,0.1)';

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 200 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      style={[cardAnimatedStyle, styles.wrapper]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            shadowColor: accent.glow,
            shadowOffset: { width: 0, height: 6 },
            elevation: isSelected ? 10 : 2,
          },
          glowAnimatedStyle,
        ]}
      >
        {/* Left: title only */}
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text
              style={styles.titleText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {title}
            </Text>
            {isSelected && (
              <View style={[styles.checkBadge, { backgroundColor: accent.glow }]}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: character animation */}
        <Animated.View style={[styles.imageWrapper, imageAnimatedStyle]}>
          {lottieSource ? (
            <LottieView source={lottieSource} autoPlay loop style={styles.lottie} />
          ) : (
            <Image source={imageSource} style={styles.image} resizeMode="contain" />
          )}
        </Animated.View>
      </Animated.View>
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
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginLeft: 10,
    width: 24,
  },
  checkText: { color: '#052e16', fontSize: 13, fontWeight: '800' },
  image: {
    height: IMG_H,
    width: IMG_W,
  },
  imageWrapper: {
    bottom: 0,
    height: IMG_H,
    position: 'absolute',
    right: 0,
    width: IMG_W,
  },
  lottie: {
    height: IMG_H,
    width: IMG_W,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 24,
    paddingRight: IMG_W + 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  wrapper: {
    marginBottom: 20,
  },
});
