import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
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

  useEffect(() => {
    const totalSteps = steps.length - 1;
    const completedSteps = currentStepIndex;
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    Animated.timing(progressAnimation, {
      toValue: progressPercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, steps.length, progressAnimation]);

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

  const [containerHeight, setContainerHeight] = useState(600);
  const availableHeight = containerHeight * 0.5;
  const stepSpacing = steps.length > 1 ? availableHeight / (steps.length - 1) : 0;
  const progressHeight = steps.length > 1 ? availableHeight : 0;

  const logoHeight = 120;
  const bottomPadding = 80;
  const contentHeight = containerHeight - logoHeight - bottomPadding;
  const verticalOffset = (contentHeight - progressHeight) / 2;
  const startOffset = logoHeight + verticalOffset;

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setContainerHeight(height);
      }}
    >
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Leaf size={22} color="#4ADE80" />
        </View>
        <Text style={styles.logoText}>AGRO</Text>
        <Text style={styles.logoSubtext}>TRADE</Text>
      </View>

      {/* Progress Container */}
      <View style={[styles.progressContainer, { top: startOffset, height: progressHeight }]}>
        {/* Progress line background */}
        <View style={styles.progressLineTrack}>
          <Animated.View
            style={[
              styles.progressLineFill,
              {
                height: progressAnimation.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <View key={step.id} style={[styles.stepWrapper, { top: index * stepSpacing - 16 }]}>
              <View style={styles.stepCircleContainer}>
                {/* Glow for current step */}
                {isCurrent && (
                  <Animated.View
                    style={[
                      styles.stepGlow,
                      {
                        opacity: glowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.15, 0.4],
                        }),
                        transform: [
                          {
                            scale: glowAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.4],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )}

                <Animated.View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCompleted,
                    isCurrent && styles.stepCurrent,
                    isPending && styles.stepPending,
                    isCurrent && { transform: [{ scale: pulseAnimation }] },
                  ]}
                >
                  {isCompleted ? (
                    <Check size={12} color="#052e16" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        isCurrent && styles.stepNumberCurrent,
                        isPending && styles.stepNumberPending,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </Animated.View>
              </View>

              {/* Step label */}
              <View style={styles.stepLabelContainer}>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                  numberOfLines={2}
                >
                  {step.title}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Progress percentage */}
      <View style={[styles.percentageContainer, { bottom: insets.bottom + 24 }]}>
        <Text style={styles.percentageValue}>
          {steps.length > 1 ? Math.round((currentStepIndex / (steps.length - 1)) * 100) : 0}%
        </Text>
        <Text style={styles.percentageLabel}>Done</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(3,15,9,0.92)',
    borderRightColor: 'rgba(74,222,128,0.18)',
    borderRightWidth: 1,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    height: '100%',
    marginLeft: '1%',
    marginTop: '1%',
    overflow: 'hidden',
    position: 'relative',
    width: 60,
  },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.35)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginBottom: 6,
    width: 44,
  },
  logoSection: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 24,
  },
  logoSubtext: {
    color: 'rgba(74,222,128,0.5)',
    fontSize: 9,
    fontWeight: '500',
  },
  logoText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  percentageContainer: {
    alignItems: 'center',
    position: 'absolute',
  },
  percentageLabel: {
    color: 'rgba(74,222,128,0.4)',
    fontSize: 9,
    marginTop: 2,
  },
  percentageValue: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
  },
  progressLineFill: {
    backgroundColor: '#4ADE80',
    left: 0,
    position: 'absolute',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    top: 0,
    width: 2,
  },
  progressLineTrack: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    bottom: 0,
    left: '50%',
    marginLeft: -1,
    position: 'absolute',
    top: 0,
    width: 2,
  },
  stepCircle: {
    alignItems: 'center',
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  stepCircleContainer: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepCompleted: {
    backgroundColor: '#4ADE80',
  },
  stepCurrent: {
    backgroundColor: 'rgba(74,222,128,0.2)',
    borderColor: '#4ADE80',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  stepGlow: {
    backgroundColor: '#4ADE80',
    borderRadius: 16,
    height: 32,
    position: 'absolute',
    width: 32,
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: 'rgba(74,222,128,0.6)',
  },
  stepLabelContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: 34,
    width: 80,
  },
  stepLabelCurrent: {
    color: '#4ADE80',
    fontWeight: '700',
  },
  stepNumber: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepNumberCurrent: {
    color: '#4ADE80',
  },
  stepNumberPending: {
    color: 'rgba(255,255,255,0.3)',
  },
  stepPending: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
  },
  stepWrapper: {
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
  },
});
