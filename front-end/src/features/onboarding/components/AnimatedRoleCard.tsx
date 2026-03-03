import React from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
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

export const AnimatedRoleCard: React.FC<AnimatedRoleCardProps> = ({
  id,
  title,
  color,
  isSelected = false,
  onPress,
  delay = 0,
  imageSource,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const pressed = useSharedValue(0);
  const selected = useSharedValue(isSelected ? 1 : 0);
  const iconRotation = useSharedValue(0);
  const iconScale = useSharedValue(1);

  React.useEffect(() => {
    // Entry animation
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 400 });
    }, delay);

    // Icon animation based on role
    if (id === 'seller') {
      // Gentle rotation for seller (wheat)
      iconRotation.value = withRepeat(
        withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (id === 'buyer') {
      // Bounce effect for buyer (cart)
      iconScale.value = withRepeat(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      // Slide effect for transporter (truck)
      iconRotation.value = withRepeat(
        withTiming(5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }

    return () => clearTimeout(timer);
  }, [delay, scale, opacity, id]);

  React.useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, { damping: 15, stiffness: 150 });
  }, [isSelected, selected]);

  const animatedStyle = useAnimatedStyle(() => {
    const pressScale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    const selectedScale = interpolate(selected.value, [0, 1], [1, 1.02]);

    return {
      transform: [{ scale: scale.value * pressScale * selectedScale }],
      opacity: opacity.value,
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${iconRotation.value}deg` }, { scale: iconScale.value }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

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

  // Glass card styles based on selection state
  const cardBg = isSelected ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)';
  const cardBorder = isSelected ? '#4ADE80' : 'rgba(255,255,255,0.15)';
  const cardBorderWidth = isSelected ? 2 : 1;

  return (
    <AnimatedPressable
      style={[animatedStyle, { marginBottom: 12 }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 16,
          borderWidth: cardBorderWidth,
          borderColor: cardBorder,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 20,
          minHeight: 90,
          // Green glow when selected
          ...(isSelected && {
            shadowColor: '#4ADE80',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
          }),
        }}
      >
        {/* Animated Icon */}
        <Animated.View style={[iconAnimatedStyle, {
          width: 72,
          height: 72,
          marginRight: 16,
        }]}>
          <Image
            source={imageSource}
            style={{
              width: 72,
              height: 72,
              resizeMode: 'contain',
            }}
          />
        </Animated.View>

        {/* Text content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: 'bold',
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {getRoleDescription()}
          </Text>
        </View>

        {/* Selection checkmark */}
        {isSelected && (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#4ADE80',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 12,
            }}
          >
            <Text style={{ color: '#052e16', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
};
