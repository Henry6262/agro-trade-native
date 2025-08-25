import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BaseComponentProps } from '../../types';

interface ButtonProps extends Omit<TouchableOpacityProps, 'className'>, BaseComponentProps {
  className?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'gradient-green' | 'gradient-blue' | 'gradient-yellow';
  size?: 'sm' | 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  onPress,
  testID,
  accessibilityLabel,
  style,
  className,
  ...props
}) => {
  const getVariantStyles = (): { container: string; text: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: 'bg-primary-600 border-primary-600',
          text: 'text-white',
        };
      case 'secondary':
        return {
          container: 'bg-secondary-600 border-secondary-600',
          text: 'text-white',
        };
      case 'outline':
        return {
          container: 'bg-transparent border-primary-600 border-2',
          text: 'text-primary-600',
        };
      case 'ghost':
        return {
          container: 'bg-transparent border-transparent',
          text: 'text-primary-600',
        };
      case 'danger':
        return {
          container: 'bg-red-600 border-red-600',
          text: 'text-white',
        };
      case 'gradient-green':
        return {
          container: 'bg-gradient-to-r from-green-600 to-green-700 border-green-600',
          text: 'text-white',
        };
      case 'gradient-blue':
        return {
          container: 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600',
          text: 'text-white',
        };
      case 'gradient-yellow':
        return {
          container: 'bg-gradient-to-r from-yellow-600 to-yellow-700 border-yellow-600',
          text: 'text-black',
        };
      case 'gradient':
        return {
          container: '',
          text: 'text-white',
        };
      default:
        return {
          container: 'bg-primary-600 border-primary-600',
          text: 'text-white',
        };
    }
  };

  const getSizeStyles = (): { container: string; text: string } => {
    switch (size) {
      case 'sm':
      case 'small':
        return {
          container: 'px-3 py-2 rounded-md',
          text: 'text-sm font-medium',
        };
      case 'medium':
        return {
          container: 'px-4 py-3 rounded-lg',
          text: 'text-base font-semibold',
        };
      case 'large':
        return {
          container: 'px-6 py-4 rounded-xl',
          text: 'text-lg font-semibold',
        };
      default:
        return {
          container: 'px-4 py-3 rounded-lg',
          text: 'text-base font-semibold',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const isDisabled = disabled || loading;
  const disabledStyles = isDisabled ? 'opacity-50' : '';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <TouchableOpacity
      className={`
        ${variantStyles.container}
        ${sizeStyles.container}
        ${disabledStyles}
        ${widthStyles}
        ${className || ''}
        border flex-row items-center justify-center
      `}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={style}
      {...props}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={
            variant === 'outline' || variant === 'ghost' 
              ? '#22C55E' 
              : variant === 'gradient-yellow' 
                ? '#000000' 
                : '#FFFFFF'
          }
          className="mr-2"
        />
      )}
      
      {children ? (
        children
      ) : (
        <>
          {leftIcon && !loading && (
            <React.Fragment>
              {leftIcon}
              <Text className="w-2" />
            </React.Fragment>
          )}
          
          {title && (
            <Text className={`${variantStyles.text} ${sizeStyles.text}`}>
              {title}
            </Text>
          )}
          
          {rightIcon && !loading && (
            <React.Fragment>
              <Text className="w-2" />
              {rightIcon}
            </React.Fragment>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};