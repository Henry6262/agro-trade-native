import React from 'react';
import { View, ScrollView, Dimensions, ViewStyle } from 'react-native';

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
  contentStyle
}) => {
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: '#111827', // bg-gray-900
    ...style
  };
  
  const contentContainerStyle: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: 16, // Consistent padding
    paddingTop: 20,
    paddingBottom: 120, // Increased to account for navigation buttons
    ...contentStyle
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

  return (
    <View style={[containerStyle, contentContainerStyle]}>
      {children}
    </View>
  );
};