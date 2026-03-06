import React from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  interpolate,
  Easing,
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

// Card has a fixed height; image is taller and anchored to the bottom
// so it naturally overflows above the card top
const CARD_H = 115;
const IMG_W = 190;
const IMG_H = 240;
// How far the image peeks above the card
const IMG_OVERFLOW = IMG_H - CARD_H; // 85px

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
  const iconFloat = useSharedValue(0);
  const iconRotation = useSharedValue(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 14, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 380 });
    }, delay);

    // Idle float / sway per role
    if (id === 'buyer') {
      iconFloat.value = withRepeat(
        withTiming(-7, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (id === 'seller') {
      iconRotation.value = withRepeat(
        withTiming(5, { duration: 2300, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      iconFloat.value = withRepeat(
        withTiming(-5, { duration: 2700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }

    return () => clearTimeout(timer);
  }, [delay, scale, opacity, id]);

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

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat.value }, { rotate: `${iconRotation.value}deg` }],
  }));

  const accent = ROLE_ACCENT[id];
  const cardBg = isSelected ? accent.bg : 'rgba(255,255,255,0.07)';
  const cardBorder = isSelected ? accent.border : 'rgba(255,255,255,0.1)';

  const getRoleDescription = () => {
    switch (id) {
      case 'buyer':
        return 'Browse and purchase quality agricultural products';
      case 'seller':
        return 'List your produce and connect with buyers';
      case 'transport':
        return 'Deliver goods and grow your logistics business';
    }
  };

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
      {/*
        paddingTop gives breathing room above the card for the overflowing image.
        The card has a fixed height; image is absolutely positioned to the right,
        anchored at the bottom, and taller than the card so it peeks above.
      */}
      <View style={styles.outerWrapper}>
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
          {/* Left: text content — paddingRight leaves room for the image */}
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

            <Text style={styles.descText}>{getRoleDescription()}</Text>
          </View>

          {/* Right: character — absolutely positioned, anchored bottom, overflows top */}
          <Animated.View style={[iconAnimatedStyle, styles.imageWrapper]}>
            <Image source={imageSource} style={styles.image} resizeMode="contain" />
          </Animated.View>
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
    overflow: 'visible',
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
  descText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 175,
  },
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
  // Anchored to bottom-right of card; taller than card so overflows above
  imageWrapper: {
    bottom: 0,
    position: 'absolute',
    right: 0,
  },
  outerWrapper: {
    // paddingTop reserves space above the card for the overflow
    overflow: 'visible',
    paddingTop: IMG_OVERFLOW,
    zIndex: 1,
  },
  textBlock: {
    justifyContent: 'center',
    paddingBottom: 18,
    paddingLeft: 20,
    // Right padding keeps text clear of the character image
    paddingRight: IMG_W + 8,
    paddingTop: 20,
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
    // negative marginBottom cancels out the next card's paddingTop overflow space,
    // leaving only ~10px of real visual gap between card bodies
    marginBottom: -(IMG_OVERFLOW - 10),
  },
});
