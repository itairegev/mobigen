import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PointsCard, TierBadge } from '@/components';
import { usePoints } from '@/hooks/usePoints';

export default function HomeScreen() {
  const router = useRouter();
  const { points, tier, nextTier, pointsToNextTier } = usePoints();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <PointsCard
          points={points}
          tier={tier}
          testID="points-card"
        />

        {nextTier && (
          <View className="bg-white rounded-xl p-4 mt-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-600">Progress to {nextTier.name}</Text>
              <TierBadge tier={nextTier.id} size="sm" />
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${((tier.minPoints - pointsToNextTier) / (nextTier.minPoints - tier.minPoints)) * 100}%` }}
              />
            </View>
            <Text className="text-gray-500 text-sm mt-2">
              {pointsToNextTier} points to go
            </Text>
          </View>
        )}

        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-purple-500 p-4 rounded-xl items-center"
              onPress={() => router.push('/scan')}
              testID="scan-button"
            >
              <Text className="text-3xl mb-2">📷</Text>
              <Text className="text-white font-medium">Scan & Earn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-white p-4 rounded-xl items-center shadow-sm"
              onPress={() => router.push('/rewards')}
              testID="rewards-button"
            >
              <Text className="text-3xl mb-2">🎁</Text>
              <Text className="text-gray-900 font-medium">Redeem</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text className="text-purple-500">See All</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-medium text-gray-900">Coffee Purchase</Text>
                  <Text className="text-gray-500 text-sm">Today, 9:30 AM</Text>
                </View>
                <Text className="text-green-500 font-semibold">+50 pts</Text>
              </View>
            </View>
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-medium text-gray-900">Reward Redeemed</Text>
                  <Text className="text-gray-500 text-sm">Yesterday</Text>
                </View>
                <Text className="text-red-500 font-semibold">-500 pts</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
