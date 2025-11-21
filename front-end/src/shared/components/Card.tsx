import React from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps, Text } from 'react-native';
import { BaseComponentProps } from '../../shared/types';

interface CardProps extends BaseComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'dark' | 'gradient';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewProps['style'] | TouchableOpacityProps['style'];
  className?: string;
}

interface CardHeaderProps extends BaseComponentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps extends BaseComponentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps extends BaseComponentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps extends BaseComponentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps extends BaseComponentProps {
  children: React.ReactNode;
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
        return 'bg-neutral-900 border border-neutral-700';
      case 'elevated':
        return 'bg-neutral-900 border border-neutral-700 shadow-lg';
      case 'dark':
        return 'bg-neutral-900 border border-neutral-700';
      case 'gradient':
        return 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30';
      default:
        // Default to dark theme for consistency
        return 'bg-neutral-900 border border-neutral-700';
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

// Simplified Card sub-components to reduce nesting
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  testID,
  accessibilityLabel,
}) => (
  <View
    className={`space-y-1.5 ${className || ''}`}
    testID={testID}
    accessibilityLabel={accessibilityLabel}
  >
    {children}
  </View>
);

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className,
  testID,
  accessibilityLabel,
}) => (
  <Text
    className={`text-xl font-semibold text-white ${className || ''}`}
    testID={testID}
    accessibilityLabel={accessibilityLabel}
  >
    {children}
  </Text>
);

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
  testID,
  accessibilityLabel,
}) => (
  <View className={className || ''} testID={testID} accessibilityLabel={accessibilityLabel}>
    {children}
  </View>
);

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className,
  testID,
  accessibilityLabel,
}) => (
  <Text
    className={`text-sm text-neutral-400 ${className || ''}`}
    testID={testID}
    accessibilityLabel={accessibilityLabel}
  >
    {children}
  </Text>
);

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  testID,
  accessibilityLabel,
}) => (
  <View
    className={`items-center ${className || ''}`}
    testID={testID}
    accessibilityLabel={accessibilityLabel}
  >
    {children}
  </View>
);
