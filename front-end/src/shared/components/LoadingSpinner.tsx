import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { BaseComponentProps } from '../../shared/types';

interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#22C55E',
  message,
  overlay = false,
  testID,
  accessibilityLabel,
}) => {
  const containerClass = overlay
    ? 'absolute inset-0 bg-black bg-opacity-50 items-center justify-center z-50'
    : 'items-center justify-center p-4';

  return (
    <View
      className={containerClass}
      testID={testID}
      accessibilityLabel={accessibilityLabel || 'Loading'}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size={size} color={color} />
      {message && <Text className="text-gray-600 mt-2 text-center">{message}</Text>}
    </View>
  );
};
