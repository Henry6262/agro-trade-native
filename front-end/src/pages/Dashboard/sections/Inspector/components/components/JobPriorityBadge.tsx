import React from 'react';
import { View, Text } from 'react-native';
import { JobPriorityBadgeProps } from '@features/dashboard/screens/inspector/types';

export const JobPriorityBadge: React.FC<JobPriorityBadgeProps> = ({
  priority,
  size = 'medium',
  className = '',
}) => {
  const getBackgroundColor = () => {
    switch (priority) {
      case 'HIGH':
        return '#ef4444'; // red
      case 'MEDIUM':
        return '#eab308'; // yellow
      case 'LOW':
        return '#ffffff'; // white
      default:
        return '#9ca3af'; // gray
    }
  };

  const getTextColor = () => {
    switch (priority) {
      case 'HIGH':
        return '#ffffff'; // white text on red
      case 'MEDIUM':
        return '#000000'; // black text on yellow
      case 'LOW':
        return '#000000'; // black text on white
      default:
        return '#ffffff';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 11,
        };
      case 'large':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
        };
      default: // medium
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();

  const getAccessibilityLabel = () => {
    const level = priority.toLowerCase();
    return `${level.charAt(0).toUpperCase() + level.slice(1)} priority job`;
  };

  return (
    <View
      testID="priority-badge"
      className={`rounded-full ${priority === 'LOW' ? 'border border-gray-300' : ''} ${className}`}
      style={{
        backgroundColor,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
      }}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityRole="text"
    >
      <Text
        style={{
          color: textColor,
          fontSize: sizeStyles.fontSize,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {priority}
      </Text>
    </View>
  );
};
