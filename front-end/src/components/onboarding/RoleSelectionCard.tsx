import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import type { OnboardingCard } from '../../types';

interface RoleSelectionCardProps {
  card: OnboardingCard;
  isSelected?: boolean;
  onPress: () => void;
  delay?: number;
  style?: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const RoleSelectionCard: React.FC<RoleSelectionCardProps> = ({
  card,
  isSelected = false,
  onPress,
  delay = 0,
  style,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pressed = useSharedValue(0);
  const selected = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    // Entry animation
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 600 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  React.useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, { damping: 15, stiffness: 150 });
  }, [isSelected, selected]);

  const animatedStyle = useAnimatedStyle(() => {
    const pressScale = interpolate(pressed.value, [0, 1], [1, 0.95]);
    const selectedScale = interpolate(selected.value, [0, 1], [1, 1.02]);
    const selectedElevation = interpolate(selected.value, [0, 1], [4, 8]);

    return {
      transform: [
        { scale: scale.value * pressScale * selectedScale },
      ],
      opacity: opacity.value,
      elevation: selectedElevation,
      shadowOpacity: interpolate(selected.value, [0, 1], [0.1, 0.2]),
      shadowRadius: interpolate(selected.value, [0, 1], [4, 8]),
      shadowOffset: {
        width: 0,
        height: interpolate(selected.value, [0, 1], [2, 4]),
      },
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(selected.value, [0, 1], [0.7, 0.5]),
    };
  });

  const borderStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(selected.value, [0, 1], [0, 3]);
    const borderOpacity = interpolate(selected.value, [0, 1], [0, 1]);

    return {
      borderWidth,
      borderColor: card.color,
      opacity: borderOpacity,
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      style={[animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      className="rounded-2xl overflow-hidden shadow-lg"
    >
      <ImageBackground
        source={{ uri: card.backgroundImage }}
        className="w-full h-full"
        resizeMode="cover"
      >
        {/* Gradient overlay */}
        <Animated.View style={overlayStyle} className="absolute inset-0">
          <LinearGradient
            colors={[...card.gradient, 'rgba(0,0,0,0.3)']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Selection border */}
        <Animated.View
          style={borderStyle}
          className="absolute inset-0 rounded-2xl"
        />

        {/* Content */}
        <View className="flex-1 justify-between p-6">
          {/* Icon */}
          <View className="items-center">
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center backdrop-blur-sm">
              <Text className="text-3xl">{card.icon}</Text>
            </View>
          </View>

          {/* Text content */}
          <View className="items-center">
            <Text className="text-white text-xl font-bold text-center mb-2">
              {card.title}
            </Text>
            <Text className="text-white/90 text-sm text-center leading-5">
              {card.description}
            </Text>
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View className="absolute top-4 right-4">
              <View 
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: card.color }}
              >
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
            </View>
          )}
        </View>
      </ImageBackground>
    </AnimatedTouchable>
  );
};

// Glass morphism effect card variant
export const GlassRoleCard: React.FC<RoleSelectionCardProps> = ({
  card,
  isSelected = false,
  onPress,
  delay = 0,
  style,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pressed = useSharedValue(0);
  const selected = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 600 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  React.useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, { damping: 15, stiffness: 150 });
  }, [isSelected, selected]);

  const animatedStyle = useAnimatedStyle(() => {
    const pressScale = interpolate(pressed.value, [0, 1], [1, 0.95]);
    const selectedScale = interpolate(selected.value, [0, 1], [1, 1.02]);

    return {
      transform: [{ scale: scale.value * pressScale * selectedScale }],
      opacity: opacity.value,
    };
  });

  const glassStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: `${card.color}20`,
      borderColor: `${card.color}40`,
      borderWidth: interpolate(selected.value, [0, 1], [1, 2]),
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      style={[animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={glassStyle}
        className="rounded-2xl p-6 backdrop-blur-md shadow-lg"
      >
        {/* Icon */}
        <View className="items-center mb-4">
          <View 
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: `${card.color}30` }}
          >
            <Text className="text-3xl">{card.icon}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="items-center">
          <Text 
            className="text-lg font-bold text-center mb-2"
            style={{ color: card.color }}
          >
            {card.title}
          </Text>
          <Text className="text-gray-600 text-sm text-center leading-5">
            {card.description}
          </Text>
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View className="absolute top-4 right-4">
            <View 
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: card.color }}
            >
              <Text className="text-white text-xs font-bold">✓</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </AnimatedTouchable>
  );
};