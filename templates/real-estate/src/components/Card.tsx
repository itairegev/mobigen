import { View } from 'react-native';
import type { ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined';
}

export function Card({
  variant = 'elevated',
  className = '',
  children,
  ...props
}: CardProps) {
  const baseClasses = 'bg-white rounded-lg';
  const variantClasses = {
    elevated: 'shadow-md',
    outlined: 'border border-gray-200',
  };

  return (
    <View
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
