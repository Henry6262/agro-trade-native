import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useOnboardingStore } from '../../store/onboardingStore';

interface OnboardingProgressProps {
  className?: string;
  showSteps?: boolean;
  animated?: boolean;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  className = '',
  showSteps = true,
  animated = true,
}) => {
  const { currentStep, totalSteps, getProgress } = useOnboardingStore();
  const progress = getProgress();
  
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progress, { duration: 800 });
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated, animatedProgress]);

  const progressBarStyle = useAnimatedStyle(() => {
    const width = interpolate(animatedProgress.value, [0, 1], [0, 100]);
    const backgroundColor = interpolateColor(
      animatedProgress.value,
      [0, 0.5, 1],
      ['#e5e7eb', '#3b82f6', '#10b981']
    );

    return {
      width: `${width}%`,
      backgroundColor,
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedProgress.value, [0, 0.1], [0.5, 1]),
    };
  });

  if (totalSteps === 0) return null;

  return (
    <Animated.View style={containerStyle} className={`${className}`}>
      {showSteps && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-medium text-gray-600">
            Progress
          </Text>
          <Text className="text-sm font-medium text-gray-900">
            {currentStep + 1} of {totalSteps}
          </Text>
        </View>
      )}
      
      <View className="relative">
        {/* Background track */}
        <View className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          {/* Progress bar */}
          <Animated.View
            style={progressBarStyle}
            className="h-full rounded-full"
          />
        </View>
        
        {/* Progress dots */}
        {showSteps && (
          <View className="absolute -top-1 left-0 right-0 flex-row justify-between items-center px-1">
            {Array.from({ length: totalSteps }, (_, index) => (
              <ProgressDot
                key={index}
                index={index}
                currentStep={currentStep}
                isCompleted={index < currentStep}
                isCurrent={index === currentStep}
                animated={animated}
              />
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

interface ProgressDotProps {
  index: number;
  currentStep: number;
  isCompleted: boolean;
  isCurrent: boolean;
  animated: boolean;
}

const ProgressDot: React.FC<ProgressDotProps> = ({
  index,
  currentStep,
  isCompleted,
  isCurrent,
  animated,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (animated) {
      if (isCurrent) {
        scale.value = withTiming(1.2, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });
      } else if (isCompleted) {
        scale.value = withTiming(1, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });
      } else {
        scale.value = withTiming(0.8, { duration: 300 });
        opacity.value = withTiming(0.4, { duration: 300 });
      }
    } else {
      scale.value = isCurrent ? 1.2 : isCompleted ? 1 : 0.8;
      opacity.value = isCurrent || isCompleted ? 1 : 0.4;
    }
  }, [isCurrent, isCompleted, animated, scale, opacity]);

  const dotStyle = useAnimatedStyle(() => {
    const backgroundColor = isCompleted 
      ? '#10b981' 
      : isCurrent 
      ? '#3b82f6' 
      : '#d1d5db';

    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor,
    };
  });

  return (
    <Animated.View
      style={dotStyle}
      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
    />
  );
};

// Circular progress variant
interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  animated?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  children,
  animated = true,
}) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progress, { duration: 1000 });
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const strokeDashoffset = circumference - (animatedProgress.value * circumference);
    
    return {
      strokeDashoffset,
    };
  });

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <View className="absolute">
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '-90deg' }],
            },
            animatedStyle,
          ]}
        />
      </View>
      
      {children && (
        <View className="absolute items-center justify-center">
          {children}
        </View>
      )}
    </View>
  );
};