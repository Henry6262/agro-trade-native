import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Wheat, Truck } from 'lucide-react-native';
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
  isSelected?: boolean;
  onPress: () => void;
  delay?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedRoleCard: React.FC<AnimatedRoleCardProps> = ({
  id,
  title,
  color,
  gradient,
  isSelected = false,
  onPress,
  delay = 0,
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
    const pressScale = interpolate(pressed.value, [0, 1], [1, 0.98]);
    const selectedScale = interpolate(selected.value, [0, 1], [1, 1.02]);
    const selectedElevation = interpolate(selected.value, [0, 1], [3, 6]);

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

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${iconRotation.value}deg` },
        { scale: iconScale.value },
      ],
    };
  });

  const borderStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(selected.value, [0, 1], [0, 2]);
    const borderOpacity = interpolate(selected.value, [0, 1], [0, 1]);

    return {
      borderWidth,
      borderColor: color,
      opacity: borderOpacity,
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  const getIcon = () => {
    const iconProps = {
      size: 32,
      color: isSelected ? color : '#94A3B8',
    };

    switch (id) {
      case 'buyer':
        return <ShoppingCart {...iconProps} />;
      case 'seller':
        return <Wheat {...iconProps} />;
      case 'transport':
        return <Truck {...iconProps} />;
    }
  };

  return (
    <AnimatedTouchable
      style={[animatedStyle, { marginBottom: 16 }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <LinearGradient
        colors={isSelected ? gradient : ['#1F2937', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          padding: 2,
        }}
      >
        <View
          style={{
            backgroundColor: '#0F172A',
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 20,
            minHeight: 90,
          }}
        >
          {/* Animated Icon on the left */}
          <View
            style={{
              width: 64,
              height: 64,
              marginRight: 20,
              backgroundColor: isSelected ? `${color}15` : 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View style={iconAnimatedStyle}>
              {getIcon()}
            </Animated.View>
          </View>

          {/* Text content on the right */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: isSelected ? color : '#94A3B8',
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 4,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                color: '#64748B',
                fontSize: 14,
              }}
            >
              {id === 'buyer' 
                ? 'Purchase products'
                : id === 'seller' 
                ? 'List your products'
                : 'Transport goods'}
            </Text>
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 12,
              }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                ✓
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Selection border overlay */}
      <Animated.View
        style={[
          borderStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            pointerEvents: 'none',
          },
        ]}
      />
    </AnimatedTouchable>
  );
};