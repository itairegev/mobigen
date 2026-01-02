import { TextInput, View, Text } from 'react-native';
import type { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 font-medium mb-2">{label}</Text>
      )}
      <View className="relative">
        {icon && (
          <View className="absolute left-3 top-3 z-10">
            {icon}
          </View>
        )}
        <TextInput
          className={`border border-gray-300 rounded-lg px-4 py-3 text-gray-900 ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-500' : ''} ${className}`}
          placeholderTextColor="#9ca3af"
          {...props}
        />
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
