import { ScrollView, View, Text } from 'react-native';
import { MortgageCalc } from '@/components';

export default function CalculatorScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-gray-900 font-bold text-2xl mb-2">Mortgage Calculator</Text>
        <Text className="text-gray-600 mb-6">
          Estimate your monthly mortgage payment
        </Text>

        <MortgageCalc testID="mortgage-calculator" />
      </View>
    </ScrollView>
  );
}
