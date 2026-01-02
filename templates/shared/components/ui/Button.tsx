import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { ReactNode } from 'react';

export interface ButtonProps {
  title?: string;
  children?: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  testID?: string;
}

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  testID,
}: ButtonProps) {
  const baseClasses = 'rounded-lg items-center justify-center flex-row';

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const variantClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    outline: 'border-2 border-blue-500 bg-transparent',
    ghost: 'bg-transparent',
    danger: 'bg-red-500',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textVariantClasses = {
    primary: 'text-white font-semibold',
    secondary: 'text-white font-semibold',
    outline: 'text-blue-500 font-semibold',
    ghost: 'text-blue-500 font-semibold',
    danger: 'text-white font-semibold',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        isDisabled ? 'opacity-50' : ''
      } ${fullWidth ? 'w-full' : ''}`}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? '#3b82f6' : '#ffffff'}
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          {(title || children) && (
            <Text className={`${textSizeClasses[size]} ${textVariantClasses[variant]}`}>
              {title || children}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
