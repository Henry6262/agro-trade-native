import React from 'react';
import { View, ScrollView, Dimensions, ViewStyle, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingStep } from '@shared/types/onboarding';
import { ProgressSidebar } from './ProgressSidebar';
import { Navigation } from './Navigation';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  // Progress sidebar props
  steps?: OnboardingStep[];
  currentStepIndex?: number;
  progressLineHeight?: number;
  isAnimating?: boolean;
  // Navigation props
  showNavigation?: boolean;
  canProceedToNext?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  // Layout customization
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  steps,
  currentStepIndex = 0,
  progressLineHeight = 0,
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
  const { width, height: windowHeight } = useWindowDimensions();

  // Calculate 10% margins for left and right
  const horizontalMargin = width * 0.1;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: '#111827', // bg-gray-50
    ...style,
  };

  const contentContainerStyle: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: horizontalMargin,
    paddingTop: insets.top,
    paddingBottom: 120, // Space for navigation buttons (already has safe area in Navigation component)
    ...contentStyle,
  };

  // If steps are provided, render with ProgressSidebar (dashboard mode)
  if (steps && steps.length > 0) {
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          backgroundColor: '#111827',
          height: windowHeight, // Explicit height to prevent overflow
          maxHeight: windowHeight, // Ensure it doesn't exceed screen
          overflow: 'hidden', // Clip any overflow
        }}
      >
        {/* Fixed Progress Sidebar */}
        <ProgressSidebar
          steps={steps}
          currentStepIndex={currentStepIndex}
          progressLineHeight={progressLineHeight}
          isAnimating={isAnimating}
        />

        {/* Main Content Area */}
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {scrollable ? (
            <ScrollView
              contentContainerStyle={contentContainerStyle}
              showsVerticalScrollIndicator={false}
              bounces={true}
              scrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View
              style={{
                flex: 1,
                paddingHorizontal: horizontalMargin,
                paddingTop: insets.top,
                overflow: 'hidden',
              }}
            >
              {children}
            </View>
          )}

          {/* Navigation */}
          {showNavigation && onNext && onBack && (
            <Navigation
              currentStepIndex={currentStepIndex}
              totalSteps={steps.length}
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

  // Fallback: Simple content wrapper (backward compatibility)
  if (scrollable) {
    return (
      <View style={containerStyle}>
        <ScrollView
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return <View style={[containerStyle, contentContainerStyle]}>{children}</View>;
};
