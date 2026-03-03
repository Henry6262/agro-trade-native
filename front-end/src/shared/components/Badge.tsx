import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { BaseComponentProps } from '../../shared/types';

interface BadgeProps extends BaseComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  style?: ViewProps['style'];
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  style,
  testID,
  accessibilityLabel,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-50';
      case 'destructive':
        return 'bg-red-600';
      case 'outline':
        return 'border border-gray-200';
      default:
        return 'bg-green-600';
    }
  };

  const baseStyles = `items-center justify-center rounded-full px-2.5 py-0.5 ${getVariantStyles()} ${className || ''}`;

  // Always wrap children in Text if it's not already a React element
  const renderContent = () => {
    if (React.isValidElement(children)) {
      return children;
    }

    // Convert everything else to string and wrap in Text
    const textContent = children === null || children === undefined ? '' : String(children);

    if (!textContent) {
      return null;
    }

    return <Text className="text-center font-semibold text-xs text-gray-900">{textContent}</Text>;
  };

  return (
    <View
      className={baseStyles}
      style={style}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {renderContent()}
    </View>
  );
};
