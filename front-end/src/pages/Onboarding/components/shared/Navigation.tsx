import React from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface NavigationProps {
  currentStepIndex: number;
  totalSteps: number;
  canProceedToNext: boolean;
  isAnimating: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function Navigation({
  currentStepIndex,
  totalSteps,
  canProceedToNext,
  isAnimating,
  onBack,
  onNext,
}: NavigationProps) {
  const insets = useSafeAreaInsets();
  const isBackDisabled = currentStepIndex === 0 || isAnimating;
  const isNextDisabled = !canProceedToNext || currentStepIndex === totalSteps - 1 || isAnimating;
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  return (
    <View
      className={`
        absolute bottom-0 left-0 right-0 z-[9999] border-t border-gray-600/80 bg-gray-50/[0.98]
        ${isMobile ? 'px-3 py-3' : 'px-4 py-4'}
      `}
      style={{
        paddingBottom: insets.bottom + 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 20,
      }}
    >
      <View className="flex-row justify-between w-full">
        <TouchableOpacity
          className={`
            flex-row items-center bg-white/90 border border-gray-600
            ${isMobile ? 'rounded-md px-3 py-2.5 min-w-[80px]' : 'rounded-lg px-4 py-3 min-w-[100px]'}
            ${isBackDisabled ? 'opacity-40' : 'opacity-100'}
          `}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 3,
          }}
          onPress={onBack}
          disabled={isBackDisabled}
          activeOpacity={0.7}
        >
          <ChevronLeft size={isMobile ? 14 : 16} color="#9CA3AF" />
          <Text
            className={`
              text-gray-400 font-medium
              ${isMobile ? 'ml-1 text-sm' : 'ml-2 text-base'}
            `}
          >
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`
            flex-row items-center
            ${isMobile ? 'rounded-md px-4 py-2.5 min-w-[80px]' : 'rounded-lg px-6 py-3 min-w-[100px]'}
            ${isNextDisabled ? 'bg-gray-600 opacity-40' : 'bg-primary-500 opacity-100'}
          `}
          style={{
            shadowColor: isNextDisabled ? '#000' : '#22C55E',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={onNext}
          disabled={isNextDisabled}
          activeOpacity={0.8}
        >
          <Text
            className={`
              text-gray-900 font-semibold
              ${isMobile ? 'text-sm' : 'text-base'}
            `}
          >
            Next
          </Text>
          <ChevronRight
            size={isMobile ? 14 : 16}
            color="white"
            className={isMobile ? 'ml-1' : 'ml-2'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
