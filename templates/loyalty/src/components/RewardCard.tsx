import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Reward } from '@/types';

interface RewardCardProps {
  reward: Reward;
  canRedeem: boolean;
  testID?: string;
}

export function RewardCard({ reward, canRedeem, testID }: RewardCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-white rounded-xl mb-3 shadow-sm overflow-hidden flex-row"
      onPress={() => router.push(`/reward/${reward.id}`)}
      disabled={!canRedeem}
      testID={testID}
    >
      <Image
        source={{ uri: reward.image }}
        className="w-24 h-24 bg-gray-100"
        resizeMode="cover"
      />
      <View className="flex-1 p-3 justify-center">
        <Text className="font-medium text-gray-900" numberOfLines={2}>
          {reward.name}
        </Text>
        <Text className="text-purple-500 font-bold mt-1">
          {reward.pointsCost.toLocaleString()} pts
        </Text>
        {!canRedeem && (
          <Text className="text-gray-400 text-xs mt-1">
            Need {(reward.pointsCost - 0).toLocaleString()} more points
          </Text>
        )}
      </View>
      {canRedeem && (
        <View className="justify-center pr-3">
          <View className="bg-purple-500 px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-medium">Redeem</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
