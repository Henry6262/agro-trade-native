import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';

interface ProductData {
  id: string;
  name: string;
  category: string;
  image: string;
  averagePrice?: number;
  unit?: string;
  inSeason?: boolean;
  varieties?: string[];
  description?: string;
}

interface ProductSelectionCardProps {
  product: ProductData;
  isSelected?: boolean;
  onPress: () => void;
  delay?: number;
  showPrice?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ProductSelectionCard: React.FC<ProductSelectionCardProps> = ({
  product,
  isSelected = false,
  onPress,
  delay = 0,
  showPrice = true,
  variant = 'default',
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const pressed = useSharedValue(0);
  const selected = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 500 });
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

  const cardStyle = useAnimatedStyle(() => {
    const borderOpacity = interpolate(selected.value, [0, 1], [0, 1]);
    const shadowOpacity = interpolate(selected.value, [0, 1], [0.1, 0.25]);
    
    return {
      borderWidth: interpolate(selected.value, [0, 1], [1, 3]),
      borderColor: isSelected ? '#10b981' : '#e5e7eb',
      shadowOpacity,
      elevation: interpolate(selected.value, [0, 1], [2, 6]),
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(selected.value, [0, 1], [0, 0.1]),
      backgroundColor: '#10b981',
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  if (variant === 'compact') {
    return (
      <AnimatedTouchable
        style={[animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        className="flex-1 m-1"
      >
        <Animated.View style={cardStyle} className="bg-white rounded-xl p-3 shadow-sm">
          <Animated.View style={overlayStyle} className="absolute inset-0 rounded-xl" />
          
          <View className="items-center">
            <Image
              source={{ uri: product.image }}
              className="w-12 h-12 rounded-lg mb-2"
              resizeMode="cover"
            />
            <Text className="text-sm font-medium text-gray-900 text-center">
              {product.name}
            </Text>
            {product.inSeason && (
              <View className="mt-1">
                <Text className="text-xs text-green-600 font-medium">In Season</Text>
              </View>
            )}
          </View>

          {isSelected && (
            <View className="absolute -top-1 -right-1">
              <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </AnimatedTouchable>
    );
  }

  if (variant === 'detailed') {
    return (
      <AnimatedTouchable
        style={[animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        className="mb-4"
      >
        <Animated.View style={cardStyle} className="bg-white rounded-xl overflow-hidden shadow-sm">
          <Animated.View style={overlayStyle} className="absolute inset-0" />
          
          <View className="flex-row">
            <Image
              source={{ uri: product.image }}
              className="w-24 h-24"
              resizeMode="cover"
            />
            
            <View className="flex-1 p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {product.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    {product.description || product.category}
                  </Text>
                  
                  {product.varieties && product.varieties.length > 0 && (
                    <Text className="text-xs text-gray-500">
                      Varieties: {product.varieties.slice(0, 2).join(', ')}
                      {product.varieties.length > 2 && ` +${product.varieties.length - 2} more`}
                    </Text>
                  )}
                </View>
                
                {showPrice && product.averagePrice && (
                  <View className="items-end">
                    <Text className="text-lg font-bold text-green-600">
                      ${product.averagePrice}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {product.unit || 'per ton'}
                    </Text>
                  </View>
                )}
              </View>
              
              <View className="flex-row items-center justify-between mt-2">
                {product.inSeason && (
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-xs text-green-700 font-medium">In Season</Text>
                  </View>
                )}
                
                {isSelected && (
                  <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </AnimatedTouchable>
    );
  }

  // Default variant
  return (
    <AnimatedTouchable
      style={[animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      className="flex-1 m-2"
    >
      <Animated.View style={cardStyle} className="bg-white rounded-xl overflow-hidden shadow-sm">
        <Animated.View style={overlayStyle} className="absolute inset-0" />
        
        {/* Image with gradient overlay */}
        <View className="relative">
          <Image
            source={{ uri: product.image }}
            className="w-full h-32"
            resizeMode="cover"
          />
          
          {product.inSeason && (
            <View className="absolute top-2 left-2">
              <LinearGradient
                colors={['#10b981', '#059669']}
                className="px-2 py-1 rounded-full"
              >
                <Text className="text-white text-xs font-medium">In Season</Text>
              </LinearGradient>
            </View>
          )}
          
          {isSelected && (
            <View className="absolute top-2 right-2">
              <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center shadow-lg">
                <Text className="text-white text-sm font-bold">✓</Text>
              </View>
            </View>
          )}
          
          {/* Bottom gradient for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            className="absolute bottom-0 left-0 right-0 h-16"
          />
        </View>

        {/* Content */}
        <View className="p-4">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {product.name}
          </Text>
          
          <Text className="text-sm text-gray-600 mb-2">
            {product.category}
          </Text>
          
          {showPrice && product.averagePrice && (
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-green-600">
                ${product.averagePrice}
              </Text>
              <Text className="text-sm text-gray-500">
                {product.unit || 'per ton'}
              </Text>
            </View>
          )}
          
          {product.varieties && product.varieties.length > 0 && (
            <Text className="text-xs text-gray-500 mt-2">
              {product.varieties.length} varieties available
            </Text>
          )}
        </View>
      </Animated.View>
    </AnimatedTouchable>
  );
};

// Category filter chip component
interface CategoryChipProps {
  category: {
    id: string;
    name: string;
    icon?: string;
  };
  isSelected: boolean;
  onPress: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  isSelected,
  onPress,
}) => {
  const selected = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, { damping: 15, stiffness: 150 });
  }, [isSelected, selected]);

  const chipStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selected.value,
      [0, 1],
      ['#f3f4f6', '#10b981']
    );
    
    return {
      backgroundColor,
      transform: [{ scale: interpolate(selected.value, [0, 1], [1, 1.05]) }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(selected.value, [0, 1], ['#374151', '#ffffff']);
    return { color };
  });

  return (
    <TouchableOpacity onPress={onPress} className="mr-2 mb-2">
      <Animated.View style={chipStyle} className="flex-row items-center px-4 py-2 rounded-full">
        {category.icon && (
          <Text className="mr-2">{category.icon}</Text>
        )}
        <Animated.Text style={textStyle} className="text-sm font-medium">
          {category.name}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};