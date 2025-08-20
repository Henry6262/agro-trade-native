import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  filters?: FilterOption[];
  selectedFilters?: string[];
  onFilterChange?: (filterId: string) => void;
  showFilters?: boolean;
  className?: string;
}

interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search products...",
  value,
  onChangeText,
  onClear,
  filters = [],
  selectedFilters = [],
  onFilterChange,
  showFilters = true,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = useSharedValue(0);
  const filtersAnimation = useSharedValue(0);

  useEffect(() => {
    focusAnimation.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused, focusAnimation]);

  useEffect(() => {
    filtersAnimation.value = withTiming(showFilters ? 1 : 0, {
      duration: 300,
    });
  }, [showFilters, filtersAnimation]);

  const containerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnimation.value,
      [0, 1],
      ['#e5e7eb', '#3b82f6']
    );
    
    return {
      borderColor,
      borderWidth: interpolate(focusAnimation.value, [0, 1], [1, 2]),
      shadowOpacity: interpolate(focusAnimation.value, [0, 1], [0.05, 0.15]),
      elevation: interpolate(focusAnimation.value, [0, 1], [2, 4]),
    };
  });

  const filtersStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(filtersAnimation.value, [0, 1], [0, 40]),
      opacity: filtersAnimation.value,
      marginTop: interpolate(filtersAnimation.value, [0, 1], [0, 12]),
    };
  });

  const clearButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(value.length, [0, 1], [0, 1]);
    return {
      transform: [{ scale }],
      opacity: scale,
    };
  });

  return (
    <View className={`${className}`}>
      {/* Search Input */}
      <Animated.View
        style={containerStyle}
        className="bg-white rounded-xl px-4 py-3 shadow-sm"
      >
        <View className="flex-row items-center">
          {/* Search Icon */}
          <View className="mr-3">
            <Text className="text-gray-400 text-lg">🔍</Text>
          </View>

          {/* Text Input */}
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* Clear Button */}
          <AnimatedTouchable
            style={clearButtonStyle}
            onPress={() => {
              onChangeText('');
              onClear?.();
            }}
            className="w-6 h-6 bg-gray-200 rounded-full items-center justify-center ml-2"
          >
            <Text className="text-gray-600 text-xs font-bold">×</Text>
          </AnimatedTouchable>
        </View>
      </Animated.View>

      {/* Filters */}
      {filters.length > 0 && (
        <Animated.View style={filtersStyle} className="overflow-hidden">
          <View className="flex-row flex-wrap">
            {filters.map((filter) => (
              <FilterChip
                key={filter.id}
                filter={filter}
                isSelected={selectedFilters.includes(filter.id)}
                onPress={() => onFilterChange?.(filter.id)}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

interface FilterChipProps {
  filter: FilterOption;
  isSelected: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ filter, isSelected, onPress }) => {
  const selectedAnimation = useSharedValue(isSelected ? 1 : 0);
  const pressAnimation = useSharedValue(0);

  useEffect(() => {
    selectedAnimation.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isSelected, selectedAnimation]);

  const chipStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectedAnimation.value,
      [0, 1],
      ['#f3f4f6', '#3b82f6']
    );

    const scale = interpolate(
      pressAnimation.value,
      [0, 1],
      [1, 0.95]
    ) * interpolate(selectedAnimation.value, [0, 1], [1, 1.02]);

    return {
      backgroundColor,
      transform: [{ scale }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      selectedAnimation.value,
      [0, 1],
      ['#374151', '#ffffff']
    );
    return { color };
  });

  const handlePressIn = () => {
    pressAnimation.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressAnimation.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      style={chipStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="flex-row items-center px-3 py-1.5 rounded-full mr-2 mb-2"
    >
      {filter.icon && (
        <Text className="mr-1.5 text-sm">{filter.icon}</Text>
      )}
      <Animated.Text style={textStyle} className="text-sm font-medium">
        {filter.label}
      </Animated.Text>
      {filter.count !== undefined && (
        <View className="ml-1.5 w-5 h-5 bg-black/10 rounded-full items-center justify-center">
          <Animated.Text style={textStyle} className="text-xs font-bold">
            {filter.count}
          </Animated.Text>
        </View>
      )}
    </AnimatedTouchable>
  );
};

// Search suggestions component
interface SearchSuggestionsProps {
  suggestions: string[];
  onSuggestionPress: (suggestion: string) => void;
  visible: boolean;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  onSuggestionPress,
  visible,
}) => {
  const animation = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    animation.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, animation]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
      height: interpolate(animation.value, [0, 1], [0, suggestions.length * 44]),
    };
  });

  if (!visible || suggestions.length === 0) return null;

  return (
    <Animated.View
      style={containerStyle}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={suggestion}
          onPress={() => onSuggestionPress(suggestion)}
          className="flex-row items-center px-4 py-3 border-b border-gray-100 last:border-b-0"
        >
          <Text className="text-gray-400 mr-3">🔍</Text>
          <Text className="flex-1 text-gray-900">{suggestion}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};