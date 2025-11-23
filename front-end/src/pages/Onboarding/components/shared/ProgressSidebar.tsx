import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Leaf } from 'lucide-react-native';
import type { OnboardingStep } from '@shared/types/onboarding';

interface ProgressSidebarProps {
  steps: OnboardingStep[];
  currentStepIndex: number;
  progressLineHeight: number;
  isAnimating: boolean;
}

export function ProgressSidebar({
  steps,
  currentStepIndex,
  progressLineHeight: _progressLineHeight,
  isAnimating: _isAnimating,
}: ProgressSidebarProps) {
  const insets = useSafeAreaInsets();
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  // Calculate progress based on completed steps
  useEffect(() => {
    const totalSteps = steps.length - 1;
    const completedSteps = currentStepIndex;
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    Animated.timing(progressAnimation, {
      toValue: progressPercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, steps.length]);

  // Pulsating animation for current step
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [currentStepIndex, pulseAnimation, glowAnimation]);

  // Calculate centered positioning for steps with 50% coverage
  const [containerHeight, setContainerHeight] = useState(600); // Default height
  const containerRef = useRef<View>(null);

  // Calculate dimensions
  const availableHeight = containerHeight * 0.5; // Use 50% of container height
  const stepSpacing = steps.length > 1 ? availableHeight / (steps.length - 1) : 0;
  const progressHeight = steps.length > 1 ? availableHeight : 0;

  // Center the progress area vertically
  const logoHeight = 120; // Approximate logo section height
  const bottomPadding = 80; // Space for percentage display
  const contentHeight = containerHeight - logoHeight - bottomPadding;
  const verticalOffset = (contentHeight - progressHeight) / 2;
  const startOffset = logoHeight + verticalOffset;

  return (
    <View
      ref={containerRef}
      style={{
        width: 75,
        height: '100%',
        backgroundColor: '#1F2937',
        borderRightWidth: 1,
        borderRightColor: '#4B5563',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setContainerHeight(height);
      }}
    >
      {/* Logo Section */}
      <View
        style={{
          paddingTop: 24,
          paddingBottom: 32,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#22C55E',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Leaf size={24} color="white" />
        </View>
        <Text
          style={{
            color: '#22C55E',
            fontSize: 12,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}
        >
          AGRO
        </Text>
        <Text
          style={{
            color: '#9CA3AF',
            fontSize: 10,
            fontWeight: '500',
          }}
        >
          TRADE
        </Text>
      </View>

      {/* Progress Container */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          alignItems: 'center',
          top: startOffset,
          height: progressHeight,
        }}
      >
        {/* Progress Line Background */}
        <View
          style={{
            position: 'absolute',
            backgroundColor: '#4B5563',
            width: 2,
            left: '50%',
            marginLeft: -1,
            top: 0,
            height: progressHeight,
          }}
        >
          {/* Animated Progress Line */}
          <Animated.View
            style={{
              width: 2,
              backgroundColor: '#22C55E',
              position: 'absolute',
              top: 0,
              left: 0,
              height: progressAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <View
              key={step.id}
              style={{
                position: 'absolute',
                alignItems: 'center',
                width: '100%',
                top: index * stepSpacing - 16, // Center the circle on the position
              }}
            >
              {/* Step Circle Container */}
              <View
                style={{ alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}
              >
                {/* Glow effect for current step */}
                {isCurrent && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#FBBF24',
                      opacity: glowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.15, 0.3],
                      }),
                      transform: [
                        {
                          scale: glowAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.3],
                          }),
                        },
                      ],
                    }}
                  />
                )}

                {/* Main Step Circle */}
                <Animated.View
                  style={[
                    {
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted ? '#22C55E' : isCurrent ? '#FBBF24' : '#4B5563',
                      borderWidth: isCurrent ? 2 : 0,
                      borderColor: isCurrent ? '#F59E0B' : 'transparent',
                      elevation: isCurrent ? 4 : 0,
                      shadowColor: isCurrent ? '#FBBF24' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isCurrent ? 0.3 : 0,
                      shadowRadius: 4,
                    },
                    isCurrent && {
                      transform: [{ scale: pulseAnimation }],
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Check size={14} color="white" strokeWidth={3} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: isCurrent ? '#92400E' : isPending ? '#6B7280' : '#D1D5DB',
                      }}
                    >
                      {index + 1}
                    </Text>
                  )}
                </Animated.View>
              </View>

              {/* Step Labels - Below circles, show for all steps */}
              <View
                style={{
                  position: 'absolute',
                  top: 34,
                  width: 80,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isCurrent ? '600' : '500',
                    color: isCompleted ? '#22C55E' : isCurrent ? '#FBBF24' : '#9CA3AF',
                    textAlign: 'center',
                  }}
                  numberOfLines={2}
                >
                  {step.title}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Progress Percentage Display */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 24,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: '#22C55E',
            fontSize: 18,
            fontWeight: 'bold',
          }}
        >
          {Math.round((currentStepIndex / (steps.length - 1)) * 100)}%
        </Text>
        <Text
          style={{
            color: '#6B7280',
            fontSize: 10,
            marginTop: 2,
          }}
        >
          Complete
        </Text>
      </View>
    </View>
  );
}
