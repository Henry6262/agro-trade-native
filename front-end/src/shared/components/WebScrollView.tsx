import React from 'react';
import { ScrollView, ScrollViewProps, Platform } from 'react-native';

/**
 * WebScrollView - A ScrollView wrapper that ensures proper scrolling on web
 * Automatically handles the flex and overflow issues on React Native Web
 */
export const WebScrollView: React.FC<ScrollViewProps> = ({
  children,
  contentContainerStyle,
  style,
  ...props
}) => {
  // On web, we need specific styling to ensure scrolling works
  const webStyle =
    Platform.OS === 'web'
      ? {
          height: '100%' as any,
          overflow: 'auto' as any,
          WebkitOverflowScrolling: 'touch' as any,
        }
      : {};

  const webContentContainerStyle =
    Platform.OS === 'web'
      ? {
          flexGrow: 1,
          ...(contentContainerStyle as any),
        }
      : {
          flexGrow: 1,
          ...(contentContainerStyle as any),
        };

  return (
    <ScrollView
      style={[webStyle, style]}
      contentContainerStyle={webContentContainerStyle}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

export default WebScrollView;
