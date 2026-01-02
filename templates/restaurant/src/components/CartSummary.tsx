import { View, Text } from 'react-native';
import { formatCurrency } from '@/utils';

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  total: number;
  testID?: string;
}

export function CartSummary({ subtotal, tax, tip, deliveryFee, total, testID }: CartSummaryProps) {
  return (
    <View className="bg-gray-50 rounded-xl p-4" testID={testID}>
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">Subtotal</Text>
        <Text className="text-gray-900 font-medium">{formatCurrency(subtotal)}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">Tax (9%)</Text>
        <Text className="text-gray-900 font-medium">{formatCurrency(tax)}</Text>
      </View>

      {tip > 0 && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Tip</Text>
          <Text className="text-gray-900 font-medium">{formatCurrency(tip)}</Text>
        </View>
      )}

      {deliveryFee > 0 && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Delivery Fee</Text>
          <Text className="text-gray-900 font-medium">{formatCurrency(deliveryFee)}</Text>
        </View>
      )}

      <View className="border-t border-gray-300 my-3" />

      <View className="flex-row justify-between">
        <Text className="text-lg font-bold text-gray-900">Total</Text>
        <Text className="text-lg font-bold text-primary-600">{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}
