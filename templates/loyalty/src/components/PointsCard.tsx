import { View, Text } from 'react-native';
import { TierBadge } from './TierBadge';
import type { Tier } from '@/types';

interface PointsCardProps {
  points: number;
  tier: Tier;
  testID?: string;
}

export function PointsCard({ points, tier, testID }: PointsCardProps) {
  return (
    <View
      className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-lg"
      style={{ backgroundColor: '#7c3aed' }}
      testID={testID}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-purple-200">Your Points</Text>
        <TierBadge tier={tier.id} />
      </View>

      <Text className="text-4xl font-bold text-white mb-1">
        {points.toLocaleString()}
      </Text>
      <Text className="text-purple-200">points available</Text>

      <View className="flex-row mt-4 pt-4 border-t border-purple-500/30">
        <View className="flex-1">
          <Text className="text-purple-200 text-xs">This Month</Text>
          <Text className="text-white font-semibold">+250 pts</Text>
        </View>
        <View className="flex-1">
          <Text className="text-purple-200 text-xs">Lifetime</Text>
          <Text className="text-white font-semibold">5,430 pts</Text>
        </View>
      </View>
    </View>
  );
}
