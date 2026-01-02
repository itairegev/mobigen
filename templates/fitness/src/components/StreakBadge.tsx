import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import { Card } from './Card';

interface StreakBadgeProps {
  streak: number;
  longestStreak?: number;
  testID?: string;
}

export function StreakBadge({ streak, longestStreak, testID }: StreakBadgeProps) {
  const streakColor = streak >= 7 ? '#ef4444' : streak >= 3 ? '#f59e0b' : '#10b981';

  return (
    <Card className="p-4" testID={testID}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm text-gray-600 mb-1">Current Streak</Text>
          <View className="flex-row items-center">
            <Flame size={32} color={streakColor} fill={streakColor} />
            <Text className="text-3xl font-bold text-gray-900 ml-2">
              {streak}
            </Text>
            <Text className="text-lg text-gray-600 ml-1">days</Text>
          </View>
          {longestStreak && longestStreak > streak && (
            <Text className="text-xs text-gray-500 mt-1">
              Best: {longestStreak} days
            </Text>
          )}
        </View>

        {streak >= 7 && (
          <View className="bg-red-50 rounded-full px-4 py-2">
            <Text className="text-xs font-bold text-red-700">ON FIRE! 🔥</Text>
          </View>
        )}
        {streak >= 3 && streak < 7 && (
          <View className="bg-yellow-50 rounded-full px-4 py-2">
            <Text className="text-xs font-bold text-yellow-700">Keep Going!</Text>
          </View>
        )}
      </View>

      {streak === 0 && (
        <View className="mt-3 bg-gray-50 rounded-lg p-3">
          <Text className="text-sm text-gray-600 text-center">
            Complete a workout today to start your streak!
          </Text>
        </View>
      )}
    </Card>
  );
}
