import React from 'react';
import { View, ScrollView, Dimensions, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  scrollable = true,
  style,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  // Calculate 10% margins for left and right
  const horizontalMargin = width * 0.1;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: '#111827', // bg-gray-900
    ...style,
  };

  const contentContainerStyle: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: horizontalMargin,
    paddingTop: insets.top + 20,
    paddingBottom: 120, // Space for navigation buttons (already has safe area in Navigation component)
    ...contentStyle,
  };

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
