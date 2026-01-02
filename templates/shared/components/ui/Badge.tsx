import { View, Text } from 'react-native';
import { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  testID?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  testID,
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const textColors = {
    default: 'text-gray-800',
    primary: 'text-blue-800',
    success: 'text-green-800',
    warning: 'text-yellow-800',
    danger: 'text-red-800',
    info: 'text-cyan-800',
  };

  return (
    <View
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${
        rounded ? 'rounded-full' : 'rounded'
      } inline-flex items-center justify-center`}
      testID={testID}
    >
      <Text className={`${textColors[variant]} font-medium`}>
        {children}
      </Text>
    </View>
  );
}
