import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { ProductQuantity } from '../../types';
import { QUANTITY_UNITS } from '../../constants/mockData';

interface QuantitySelectorProps {
  value: ProductQuantity;
  onChange: (quantity: ProductQuantity) => void;
  label?: string;
  placeholder?: string;
  showEstimate?: boolean;
  estimatedValue?: number;
  className?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  label = "Quantity",
  placeholder = "Enter quantity",
  showEstimate = false,
  estimatedValue,
  className = '',
}) => {
  const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const focusAnimation = useSharedValue(0);
  const errorAnimation = useSharedValue(0);

  React.useEffect(() => {
    focusAnimation.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused, focusAnimation]);

  const containerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnimation.value,
      [0, 1],
      ['#e5e7eb', '#3b82f6']
    );
    
    return {
      borderColor,
      borderWidth: interpolate(focusAnimation.value, [0, 1], [1, 2]),
    };
  });

  const handleAmountChange = (text: string) => {
    const numericValue = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (!isNaN(numericValue) || text === '') {
      onChange({
        ...value,
        amount: isNaN(numericValue) ? 0 : numericValue,
      });
    }
  };

  const handleUnitChange = (unit: ProductQuantity['unit']) => {
    onChange({
      ...value,
      unit,
    });
    setIsUnitModalVisible(false);
  };

  const getUnitLabel = () => {
    const unit = QUANTITY_UNITS.find(u => u.value === value.unit);
    return unit?.short || value.unit;
  };

  const getUnitFullLabel = () => {
    const unit = QUANTITY_UNITS.find(u => u.value === value.unit);
    return unit?.label || value.unit;
  };

  return (
    <View className={className}>
      {label && (
        <Text className="text-base font-medium text-gray-900 mb-2">
          {label}
        </Text>
      )}

      <Animated.View
        style={containerStyle}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <View className="flex-row items-center">
          {/* Amount Input */}
          <View className="flex-1 px-4 py-3">
            <TextInput
              className="text-lg font-semibold text-gray-900"
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              value={value.amount > 0 ? value.amount.toString() : ''}
              onChangeText={handleAmountChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Unit Selector */}
          <TouchableOpacity
            onPress={() => setIsUnitModalVisible(true)}
            className="bg-gray-50 px-4 py-3 border-l border-gray-200"
          >
            <View className="flex-row items-center">
              <Text className="text-lg font-medium text-gray-700 mr-2">
                {getUnitLabel()}
              </Text>
              <Text className="text-gray-400">▼</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Estimated Value */}
        {showEstimate && estimatedValue && value.amount > 0 && (
          <View className="px-4 py-2 bg-blue-50 border-t border-blue-100">
            <Text className="text-sm text-blue-700">
              Estimated value: <Text className="font-semibold">${(estimatedValue * value.amount).toLocaleString()}</Text>
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Unit Selection Modal */}
      <Modal
        visible={isUnitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUnitModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-96">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                Select Unit
              </Text>
              <TouchableOpacity
                onPress={() => setIsUnitModalVisible(false)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Text className="text-gray-600 font-bold">×</Text>
              </TouchableOpacity>
            </View>

            {/* Unit Options */}
            <View className="p-4">
              {QUANTITY_UNITS.map((unit, index) => (
                <UnitOption
                  key={unit.value}
                  unit={unit}
                  isSelected={value.unit === unit.value}
                  onPress={() => handleUnitChange(unit.value as ProductQuantity['unit'])}
                  delay={index * 50}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

interface UnitOptionProps {
  unit: {
    value: string;
    label: string;
    short: string;
  };
  isSelected: boolean;
  onPress: () => void;
  delay: number;
}

const UnitOption: React.FC<UnitOptionProps> = ({ unit, isSelected, onPress, delay }) => {
  const animation = useSharedValue(0);
  const selectedAnimation = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      animation.value = withSpring(1, { damping: 15, stiffness: 150 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, animation]);

  React.useEffect(() => {
    selectedAnimation.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isSelected, selectedAnimation]);

  const containerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectedAnimation.value,
      [0, 1],
      ['#ffffff', '#eff6ff']
    );

    const borderColor = interpolateColor(
      selectedAnimation.value,
      [0, 1],
      ['#e5e7eb', '#3b82f6']
    );

    return {
      backgroundColor,
      borderColor,
      borderWidth: interpolate(selectedAnimation.value, [0, 1], [1, 2]),
      opacity: animation.value,
      transform: [
        { translateY: interpolate(animation.value, [0, 1], [20, 0]) },
        { scale: interpolate(selectedAnimation.value, [0, 1], [1, 1.02]) },
      ],
    };
  });

  return (
    <AnimatedTouchable
      style={containerStyle}
      onPress={onPress}
      className="flex-row items-center justify-between p-4 rounded-xl mb-2"
    >
      <View>
        <Text className="text-base font-semibold text-gray-900">
          {unit.label}
        </Text>
        <Text className="text-sm text-gray-500">
          Short: {unit.short}
        </Text>
      </View>

      {isSelected && (
        <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
          <Text className="text-white text-xs font-bold">✓</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
};

// Quick quantity preset buttons
interface QuickQuantityProps {
  presets: number[];
  unit: string;
  onSelect: (amount: number) => void;
  className?: string;
}

export const QuickQuantitySelector: React.FC<QuickQuantityProps> = ({
  presets,
  unit,
  onSelect,
  className = '',
}) => {
  return (
    <View className={`${className}`}>
      <Text className="text-sm font-medium text-gray-700 mb-3">
        Quick Select ({unit})
      </Text>
      <View className="flex-row flex-wrap">
        {presets.map((amount, index) => (
          <QuickPresetButton
            key={amount}
            amount={amount}
            unit={unit}
            onPress={() => onSelect(amount)}
            delay={index * 50}
          />
        ))}
      </View>
    </View>
  );
};

interface QuickPresetButtonProps {
  amount: number;
  unit: string;
  onPress: () => void;
  delay: number;
}

const QuickPresetButton: React.FC<QuickPresetButtonProps> = ({
  amount,
  unit,
  onPress,
  delay,
}) => {
  const animation = useSharedValue(0);
  const pressAnimation = useSharedValue(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      animation.value = withSpring(1, { damping: 15, stiffness: 150 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, animation]);

  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
      transform: [
        { translateY: interpolate(animation.value, [0, 1], [10, 0]) },
        { scale: interpolate(pressAnimation.value, [0, 1], [1, 0.95]) },
      ],
    };
  });

  const handlePressIn = () => {
    pressAnimation.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressAnimation.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      style={buttonStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="bg-gray-100 px-4 py-2 rounded-full mr-2 mb-2"
    >
      <Text className="text-gray-700 font-medium">
        {amount} {unit}
      </Text>
    </AnimatedTouchable>
  );
};