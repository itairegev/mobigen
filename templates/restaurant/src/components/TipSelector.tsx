import { View, Text, TouchableOpacity } from 'react-native';
import { formatCurrency } from '@/utils';

interface TipSelectorProps {
  subtotal: number;
  selectedTip: number;
  onSelectTip: (amount: number) => void;
  testID?: string;
}

export function TipSelector({ subtotal, selectedTip, onSelectTip, testID }: TipSelectorProps) {
  const tipOptions = [
    { label: '15%', value: subtotal * 0.15 },
    { label: '18%', value: subtotal * 0.18 },
    { label: '20%', value: subtotal * 0.20 },
    { label: 'Custom', value: 0 },
  ];

  return (
    <View className="mb-4" testID={testID}>
      <Text className="text-lg font-bold text-gray-900 mb-3">
        Add a Tip
      </Text>

      <View className="flex-row gap-3">
        {tipOptions.map((option) => {
          const isSelected = option.label === 'Custom'
            ? selectedTip > 0 && !tipOptions.slice(0, 3).some(o => Math.abs(o.value - selectedTip) < 0.01)
            : Math.abs(option.value - selectedTip) < 0.01;

          return (
            <TouchableOpacity
              key={option.label}
              onPress={() => onSelectTip(option.value)}
              className={`flex-1 p-4 rounded-lg border-2 ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
              testID={`${testID}-${option.label}`}
            >
              <Text
                className={`text-center font-semibold ${
                  isSelected ? 'text-primary-600' : 'text-gray-700'
                }`}
              >
                {option.label}
              </Text>
              {option.value > 0 && (
                <Text
                  className={`text-center text-sm mt-1 ${
                    isSelected ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  {formatCurrency(option.value)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => onSelectTip(0)}
        className="mt-3"
        testID={`${testID}-no-tip`}
      >
        <Text className="text-center text-gray-600">
          {selectedTip === 0 ? '✓ ' : ''}No tip
        </Text>
      </TouchableOpacity>
    </View>
  );
}
