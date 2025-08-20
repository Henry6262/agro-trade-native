import React from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps } from 'react-native';
import { BaseComponentProps } from '../../types';

interface CardProps extends BaseComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewProps['style'] | TouchableOpacityProps['style'];
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  onPress,
  testID,
  accessibilityLabel,
  style,
  className,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return 'bg-white border border-gray-200';
      case 'elevated':
        return 'bg-white shadow-lg';
      default:
        return 'bg-white shadow-md';
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'small':
        return 'p-2';
      case 'large':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const baseStyles = `${getVariantStyles()} ${getPaddingStyles()} rounded-lg ${className || ''}`;

  if (onPress) {
    return (
      <TouchableOpacity
        className={baseStyles}
        onPress={onPress}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={style}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={baseStyles}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {children}
    </View>
  );
};