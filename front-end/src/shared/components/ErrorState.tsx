import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { BaseComponentProps } from '../../shared/types';

interface ErrorStateProps extends BaseComponentProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  icon,
  testID,
  accessibilityLabel,
}) => {
  return (
    <View 
      className="flex-1 items-center justify-center p-8"
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {icon && (
        <View className="mb-4">
          {icon}
        </View>
      )}
      
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
        {title}
      </Text>
      
      <Text className="text-base text-gray-600 text-center mb-6 max-w-sm">
        {message}
      </Text>
      
      {onRetry && (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="primary"
          size="medium"
        />
      )}
    </View>
  );
};