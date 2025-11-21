import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { BaseComponentProps } from '../../shared/types';

interface InputProps extends TextInputProps, BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required = false,
  leftIcon,
  rightIcon,
  helperText,
  variant = 'outline',
  size = 'medium',
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  testID,
  accessibilityLabel,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getVariantStyles = () => {
    const hasError = !!error;
    const focusedColor = hasError ? 'border-red-500' : 'border-green-500';
    const defaultColor = hasError ? 'border-red-300' : 'border-neutral-600';

    switch (variant) {
      case 'filled':
        return {
          container: `bg-neutral-800 border-b-2 ${isFocused ? focusedColor : defaultColor}`,
          input: 'bg-transparent text-white',
        };
      case 'outline':
        return {
          container: `bg-neutral-800 border-2 rounded-lg ${isFocused ? focusedColor : defaultColor}`,
          input: 'bg-transparent text-white',
        };
      default:
        return {
          container: `bg-neutral-800 border-b-2 ${isFocused ? focusedColor : defaultColor}`,
          input: 'bg-transparent text-white',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'px-3 py-2',
          input: 'text-sm',
          label: 'text-sm',
        };
      case 'large':
        return {
          container: 'px-4 py-4',
          input: 'text-lg',
          label: 'text-base',
        };
      default:
        return {
          container: 'px-4 py-3',
          input: 'text-base',
          label: 'text-sm',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isPassword = secureTextEntry;
  const showPassword = isPassword && !isPasswordVisible;

  return (
    <View className="w-full">
      {label && (
        <Text className={`${sizeStyles.label} font-medium text-neutral-300 mb-1`}>
          {label}
          {required && <Text className="text-red-500 ml-1">*</Text>}
        </Text>
      )}

      <View className={`${variantStyles.container} ${sizeStyles.container} flex-row items-center`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className={`${variantStyles.input} ${sizeStyles.input} flex-1`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          secureTextEntry={showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
          accessibilityLabel={accessibilityLabel || label}
          style={style}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity onPress={handlePasswordToggle} className="ml-3">
            <Text className="text-neutral-400 text-sm">{isPasswordVisible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && <View className="ml-3">{rightIcon}</View>}
      </View>

      {(error || helperText) && (
        <Text className={`${sizeStyles.label} mt-1 ${error ? 'text-red-500' : 'text-neutral-400'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};
