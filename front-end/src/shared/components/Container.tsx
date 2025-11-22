import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  ViewStyle,
  StyleProp,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeArea?: boolean;
  maxWidth?: number;
  centered?: boolean;
  noPadding?: boolean;
  backgroundColor?: string;
}

/**
 * Container component that provides a consistent layout with safe area handling and scrolling
 *
 * Features:
 * - Safe area handling for iOS notches and Android status bars
 * - Optional scrolling with keyboard dismissal
 * - Maximum width constraint for large screens
 * - Centered content option for better desktop display
 * - Consistent padding and styling
 *
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The content to be rendered inside the container
 * @param {boolean} props.scroll - Whether to enable scrolling (default: false)
 * @param {boolean} props.safeArea - Whether to use SafeAreaView (default: true)
 * @param {number} props.maxWidth - Maximum width for the container content
 * @param {boolean} props.centered - Whether to center the content horizontally
 * @param {boolean} props.noPadding - Whether to remove default padding
 * @param {string} props.backgroundColor - Background color for the container
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  safeArea = true,
  maxWidth,
  centered = false,
  noPadding = false,
  backgroundColor = '#000000',
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');

  const containerStyle: StyleProp<ViewStyle> = [
    {
      flex: 1,
      backgroundColor,
    },
    style,
  ];

  const contentStyle: StyleProp<ViewStyle> = [
    {
      flexGrow: 1,
      paddingHorizontal: noPadding ? 0 : Platform.OS === 'web' && screenWidth > 768 ? 24 : 16,
      paddingVertical: noPadding ? 0 : 16,
      paddingBottom: noPadding ? 0 : insets.bottom + 16, // Dynamic safe area handling
    },
    centered && {
      alignItems: 'center',
    },
    maxWidth && {
      maxWidth,
      width: '100%',
      alignSelf: 'center',
    },
    contentContainerStyle,
  ];

  const WrapperComponent = safeArea ? SafeAreaView : View;

  if (scroll) {
    return (
      <WrapperComponent style={containerStyle}>
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      </WrapperComponent>
    );
  }

  return (
    <WrapperComponent style={containerStyle}>
      <View style={contentStyle}>{children}</View>
    </WrapperComponent>
  );
};

/**
 * PageContainer - A variant of Container specifically for full page layouts
 * Includes responsive max-width for better desktop display
 */
export const PageContainer: React.FC<ContainerProps> = (props) => {
  const { width: screenWidth } = Dimensions.get('window');

  // Apply responsive max-width based on screen size
  const getMaxWidth = () => {
    if (Platform.OS === 'web') {
      if (screenWidth > 1440) return 1440;
      if (screenWidth > 1024) return 1200;
      if (screenWidth > 768) return 960;
    }
    return undefined;
  };

  return (
    <Container
      maxWidth={getMaxWidth()}
      centered={Platform.OS === 'web' && screenWidth > 768}
      {...props}
    />
  );
};

/**
 * ContentContainer - A variant for content sections within pages
 * Provides consistent spacing and responsive width
 */
export const ContentContainer: React.FC<ContainerProps> = (props) => {
  return (
    <View
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 12,
          width: '100%',
        },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
};
