import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionItem } from '@/components';
import { useTransactions } from '@/hooks/useTransactions';

export default function HistoryScreen() {
  const { transactions, isLoading } = useTransactions();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            testID={`transaction-${item.id}`}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-6xl mb-4">📋</Text>
            <Text className="text-gray-500">
              {isLoading ? 'Loading...' : 'No transactions yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
