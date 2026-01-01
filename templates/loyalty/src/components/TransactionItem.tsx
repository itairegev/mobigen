import { View, Text } from 'react-native';
import type { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  testID?: string;
}

export function TransactionItem({ transaction, testID }: TransactionItemProps) {
  const isEarn = transaction.type === 'earn';
  const pointsText = `${isEarn ? '+' : '-'}${transaction.points.toLocaleString()} pts`;
  const pointsColor = isEarn ? 'text-green-500' : 'text-red-500';

  return (
    <View
      className="bg-white p-4 rounded-lg mb-2 flex-row items-center"
      testID={testID}
    >
      <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
        <Text>{transaction.icon || (isEarn ? '💰' : '🎁')}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-medium text-gray-900">{transaction.description}</Text>
        <Text className="text-gray-500 text-sm">{transaction.date}</Text>
      </View>
      <Text className={`font-semibold ${pointsColor}`}>{pointsText}</Text>
    </View>
  );
}
