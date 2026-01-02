import { View, Text, TextInput } from 'react-native';
import { DollarSign } from 'lucide-react-native';

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  testID?: string;
}

export function PriceInput({ value, onChange, label, error, testID }: PriceInputProps) {
  const handleChange = (text: string) => {
    // Only allow numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    onChange(cleaned);
  };

  return (
    <View className="mb-4">
      {label && <Text className="text-gray-700 font-medium mb-1">{label}</Text>}

      <View
        className={`flex-row items-center border rounded-lg px-4 py-3 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <DollarSign size={20} color="#64748b" />
        <TextInput
          className="flex-1 text-gray-900 text-lg ml-1"
          placeholder="0.00"
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          testID={testID}
        />
      </View>

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
