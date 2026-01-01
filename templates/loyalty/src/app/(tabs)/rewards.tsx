import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RewardCard } from '@/components';
import { useRewards } from '@/hooks/useRewards';
import { usePoints } from '@/hooks/usePoints';

export default function RewardsScreen() {
  const { rewards, isLoading } = useRewards();
  const { points } = usePoints();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-purple-500 p-4">
        <Text className="text-white text-center">
          You have <Text className="font-bold">{points.toLocaleString()}</Text> points to spend
        </Text>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <RewardCard
            reward={item}
            canRedeem={points >= item.pointsCost}
            testID={`reward-${item.id}`}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-gray-500">
              {isLoading ? 'Loading rewards...' : 'No rewards available'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
