import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { BaseComponentProps } from '../../types';

interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
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
      
      {description && (
        <Text className="text-base text-gray-600 text-center mb-6 max-w-sm">
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="medium"
        />
      )}
    </View>
  );
};