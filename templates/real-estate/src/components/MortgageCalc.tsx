import { useState } from 'react';
import { View, Text } from 'react-native';
import { Card } from './Card';
import { Input } from './Input';
import { formatCurrency, calculateMortgage } from '@/utils';

interface MortgageCalcProps {
  initialPrice?: number;
  testID?: string;
}

export function MortgageCalc({ initialPrice = 500000, testID }: MortgageCalcProps) {
  const [homePrice, setHomePrice] = useState(initialPrice.toString());
  const [downPayment, setDownPayment] = useState('20');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('30');

  const result = calculateMortgage(
    parseFloat(homePrice) || 0,
    parseFloat(downPayment) || 0,
    parseFloat(interestRate) || 0,
    parseInt(loanTerm, 10) || 30
  );

  return (
    <View testID={testID}>
      <Card className="p-4 mb-4">
        <Input
          label="Home Price"
          placeholder="500000"
          keyboardType="numeric"
          value={homePrice}
          onChangeText={setHomePrice}
          testID={`${testID}-home-price`}
        />
        <Input
          label="Down Payment (%)"
          placeholder="20"
          keyboardType="numeric"
          value={downPayment}
          onChangeText={setDownPayment}
          testID={`${testID}-down-payment`}
        />
        <Input
          label="Interest Rate (%)"
          placeholder="6.5"
          keyboardType="numeric"
          value={interestRate}
          onChangeText={setInterestRate}
          testID={`${testID}-interest-rate`}
        />
        <Input
          label="Loan Term (years)"
          placeholder="30"
          keyboardType="numeric"
          value={loanTerm}
          onChangeText={setLoanTerm}
          testID={`${testID}-loan-term`}
        />
      </Card>

      <Card className="p-4">
        <Text className="text-gray-900 font-bold text-lg mb-4">Monthly Payment</Text>
        <Text className="text-primary-600 font-bold text-4xl mb-6">
          {formatCurrency(result.monthlyPayment)}
        </Text>

        <View className="space-y-3">
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-gray-600">Loan Amount</Text>
            <Text className="text-gray-900 font-semibold">
              {formatCurrency(result.loanAmount)}
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-gray-600">Down Payment</Text>
            <Text className="text-gray-900 font-semibold">
              {formatCurrency(result.downPaymentAmount)} ({result.downPaymentPercent}%)
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-gray-600">Total Payment</Text>
            <Text className="text-gray-900 font-semibold">
              {formatCurrency(result.totalPayment)}
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-600">Total Interest</Text>
            <Text className="text-gray-900 font-semibold">
              {formatCurrency(result.totalInterest)}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}
