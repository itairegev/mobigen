import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { ReactNode, useState } from 'react';

export interface InputProps extends Omit<TextInputProps, 'testID'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
  testID?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  testID,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const variantClasses = {
    default: 'border border-gray-300 bg-white',
    filled: 'border-0 bg-gray-100',
    outlined: 'border-2 border-gray-300 bg-transparent',
  };

  const focusedClasses = isFocused
    ? variant === 'outlined'
      ? 'border-blue-500'
      : 'border-blue-400'
    : '';

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 font-medium mb-2">{label}</Text>
      )}

      <View
        className={`${variantClasses[variant]} ${
          error ? 'border-red-500' : focusedClasses
        } rounded-lg flex-row items-center px-4`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}

        <TextInput
          className="flex-1 py-3 text-gray-900"
          placeholderTextColor="#9ca3af"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
          {...props}
        />

        {rightIcon && (
          onRightIconPress ? (
            <TouchableOpacity onPress={onRightIconPress} className="ml-2">
              {rightIcon}
            </TouchableOpacity>
          ) : (
            <View className="ml-2">{rightIcon}</View>
          )
        )}
      </View>

      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text className="text-gray-500 text-sm mt-1">{helperText}</Text>
      )}
    </View>
  );
}
