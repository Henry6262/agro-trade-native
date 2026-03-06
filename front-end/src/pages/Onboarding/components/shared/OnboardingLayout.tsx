import React from 'react';
import { View, Text, ScrollView, ViewStyle, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import type { OnboardingStep } from '@shared/types/onboarding';
import { Navigation } from './Navigation';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  steps?: OnboardingStep[];
  currentStepIndex?: number;
  progressLineHeight?: number;
  isAnimating?: boolean;
  showNavigation?: boolean;
  canProceedToNext?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  steps,
  currentStepIndex = 0,
  isAnimating = false,
  showNavigation = true,
  canProceedToNext = true,
  onNext,
  onBack,
  scrollable = true,
  style,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();
  const hasSteps = steps && steps.length > 0;

  // Animated progress bar width
  const progressValue = useSharedValue(
    hasSteps && steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 0
  );

  React.useEffect(() => {
    if (hasSteps && steps.length > 1) {
      progressValue.value = withTiming((currentStepIndex / (steps.length - 1)) * 100, {
        duration: 600,
      });
    }
  }, [currentStepIndex, hasSteps, steps?.length]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%` as any,
  }));

  const currentStep = hasSteps ? steps[currentStepIndex] : null;
  const totalSteps = hasSteps ? steps.length : 0;

  const contentContainerStyle: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
    ...contentStyle,
  };

  if (hasSteps) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }, style]}>
        {/* ── Top progress header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Left: step counter */}
            <View style={styles.stepCounterPill}>
              <Text style={styles.stepCounterText}>
                {currentStepIndex + 1} / {totalSteps}
              </Text>
            </View>

            {/* Centre: step title + description */}
            <View style={styles.headerMid}>
              <Text style={styles.stepTitle} numberOfLines={1}>
                {currentStep?.title ?? ''}
              </Text>
              {currentStep?.description ? (
                <Text style={styles.stepDesc} numberOfLines={1}>
                  {currentStep.description}
                </Text>
              ) : null}
            </View>

            {/* Right: dot indicators */}
            <View style={styles.dotsRow}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.headerDot,
                    i < currentStepIndex && styles.headerDotDone,
                    i === currentStepIndex && styles.headerDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Thin animated progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressBarStyle]} />
          </View>
        </View>

        {/* ── Content ── */}
        <View style={styles.contentArea}>
          {scrollable ? (
            <ScrollView
              contentContainerStyle={contentContainerStyle}
              showsVerticalScrollIndicator={false}
              bounces
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.contentArea, { paddingHorizontal: 20 }]}>{children}</View>
          )}

          {/* ── Bottom navigation ── */}
          {showNavigation && onNext && onBack && (
            <Navigation
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              canProceedToNext={canProceedToNext}
              isAnimating={isAnimating}
              onBack={onBack}
              onNext={onNext}
            />
          )}
        </View>
      </View>
    );
  }

  // Fallback: no steps — simple wrapper
  const fallbackStyle: ViewStyle = {
    flex: 1,
    backgroundColor: 'transparent',
    ...style,
  };

  if (scrollable) {
    return (
      <View style={fallbackStyle}>
        <ScrollView
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          bounces
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return <View style={[fallbackStyle, contentContainerStyle]}>{children}</View>;
};

const styles = StyleSheet.create({
  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  header: {
    backgroundColor: 'rgba(3,15,9,0.85)',
    borderBottomColor: 'rgba(74,222,128,0.12)',
    borderBottomWidth: 1,
    paddingBottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  headerDot: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  headerDotActive: {
    backgroundColor: '#4ADE80',
    borderRadius: 3,
    width: 18,
  },
  headerDotDone: {
    backgroundColor: 'rgba(74,222,128,0.45)',
  },
  headerMid: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressFill: {
    backgroundColor: '#4ADE80',
    borderRadius: 2,
    height: '100%',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  progressTrack: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderRadius: 2,
    height: 3,
    overflow: 'hidden',
    width: '100%',
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  stepCounterPill: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.25)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepCounterText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
  stepDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 1,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
