import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  testID?: string;
}

export function Input({ label, error, testID, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 font-medium mb-1">{label}</Text>
      )}
      <TextInput
        className={`border rounded-lg px-4 py-3 text-gray-900 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholderTextColor="#9ca3af"
        testID={testID}
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
