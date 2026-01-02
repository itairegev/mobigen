import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { GivingFund } from '../types';

interface GivingFormProps {
  funds: GivingFund[];
  onSubmit: (amount: number, frequency: 'one-time' | 'weekly' | 'monthly', fundId: string) => void;
  isLoading?: boolean;
  testID?: string;
}

export function GivingForm({ funds, onSubmit, isLoading, testID }: GivingFormProps) {
  const [selectedFund, setSelectedFund] = useState(funds[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'monthly'>('one-time');

  const quickAmounts = [25, 50, 100, 250];

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && selectedFund) {
      onSubmit(numAmount, frequency, selectedFund);
    }
  };

  return (
    <ScrollView className="flex-1" testID={testID}>
      <View className="p-6">
        {/* Fund Selection */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Select Fund</Text>
        <View className="mb-6">
          {funds.map((fund) => (
            <TouchableOpacity
              key={fund.id}
              onPress={() => setSelectedFund(fund.id)}
              className={`p-4 rounded-lg mb-2 border-2 ${
                selectedFund === fund.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
              testID={`fund-${fund.id}`}
            >
              <Text className="font-semibold text-gray-900 mb-1">{fund.name}</Text>
              <Text className="text-sm text-gray-600">{fund.description}</Text>
              {fund.goal && (
                <View className="mt-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-500">
                      ${fund.raised?.toLocaleString()} of ${fund.goal.toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {Math.round(((fund.raised || 0) / fund.goal) * 100)}%
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className={`h-full`}
                      style={{
                        width: `${Math.min(((fund.raised || 0) / fund.goal) * 100, 100)}%`,
                        backgroundColor: fund.color,
                      }}
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount Selection */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Amount</Text>
        <View className="flex-row mb-4">
          {quickAmounts.map((quickAmount) => (
            <TouchableOpacity
              key={quickAmount}
              onPress={() => setAmount(String(quickAmount))}
              className={`flex-1 p-3 rounded-lg mr-2 ${
                amount === String(quickAmount)
                  ? 'bg-primary-500'
                  : 'bg-gray-100'
              }`}
              testID={`quick-amount-${quickAmount}`}
            >
              <Text
                className={`text-center font-semibold ${
                  amount === String(quickAmount) ? 'text-white' : 'text-gray-700'
                }`}
              >
                ${quickAmount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-6">
          <Text className="text-2xl text-gray-700 mr-2">$</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            className="flex-1 text-2xl text-gray-900"
            testID="amount-input"
          />
        </View>

        {/* Frequency Selection */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Frequency</Text>
        <View className="flex-row mb-6">
          {(['one-time', 'weekly', 'monthly'] as const).map((freq) => (
            <TouchableOpacity
              key={freq}
              onPress={() => setFrequency(freq)}
              className={`flex-1 p-3 rounded-lg mr-2 ${
                frequency === freq ? 'bg-primary-500' : 'bg-gray-100'
              }`}
              testID={`frequency-${freq}`}
            >
              <Text
                className={`text-center font-semibold capitalize ${
                  frequency === freq ? 'text-white' : 'text-gray-700'
                }`}
              >
                {freq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          className={`bg-primary-500 p-4 rounded-lg ${
            (!amount || parseFloat(amount) <= 0 || isLoading) ? 'opacity-50' : ''
          }`}
          testID="submit-donation-button"
        >
          <Text className="text-white text-center font-bold text-lg">
            {isLoading ? 'Processing...' : 'Give Now'}
          </Text>
        </TouchableOpacity>

        <Text className="text-xs text-gray-500 text-center mt-4">
          Your donation is secure and tax-deductible
        </Text>
      </View>
    </ScrollView>
  );
}
