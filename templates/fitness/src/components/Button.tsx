import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
  size = 'md',
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const baseClasses = 'rounded-lg items-center justify-center';
  const variantClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    outline: 'border-2 border-primary-500 bg-transparent',
  };
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  const textClasses = {
    primary: 'text-white font-semibold',
    secondary: 'text-white font-semibold',
    outline: 'text-primary-500 font-semibold',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        disabled ? 'opacity-50' : ''
      }`}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#10b981' : '#ffffff'} />
      ) : (
        <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
