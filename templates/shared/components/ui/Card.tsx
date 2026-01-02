import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  footer?: ReactNode;
  header?: ReactNode;
  testID?: string;
  style?: ViewStyle;
}

export function Card({
  title,
  subtitle,
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  footer,
  header,
  testID,
  style,
}: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  const variantClasses = {
    default: 'bg-white rounded-xl',
    elevated: 'bg-white rounded-xl shadow-lg',
    outlined: 'bg-white rounded-xl border border-gray-200',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <Wrapper
      onPress={onPress}
      className={`${variantClasses[variant]} ${paddingClasses[padding]} mb-4`}
      testID={testID}
      style={style}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {header}
      {(title || subtitle) && (
        <View className="mb-3">
          {title && (
            <Text className="text-lg font-semibold text-gray-900">{title}</Text>
          )}
          {subtitle && (
            <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
          )}
        </View>
      )}
      {children}
      {footer && <View className="mt-3 pt-3 border-t border-gray-100">{footer}</View>}
    </Wrapper>
  );
}
