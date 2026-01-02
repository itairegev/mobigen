import { View, Text } from 'react-native';
import { Card } from './Card';
import { WeeklyStats } from '@/types';

interface ProgressChartProps {
  data: WeeklyStats[];
  testID?: string;
}

export function ProgressChart({ data, testID }: ProgressChartProps) {
  // Simple bar chart using relative heights
  const maxWorkouts = Math.max(...data.map((d) => d.workouts), 1);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="p-4" testID={testID}>
      <Text className="text-base font-semibold text-gray-900 mb-4">
        This Week's Activity
      </Text>

      <View className="flex-row items-end justify-between h-40">
        {days.map((day, idx) => {
          const dayData = data[idx] || { workouts: 0, minutes: 0, calories: 0, week: '' };
          const height = (dayData.workouts / maxWorkouts) * 100;

          return (
            <View key={day} className="flex-1 items-center">
              <View className="flex-1 justify-end items-center w-full px-1">
                <View
                  className="bg-primary-500 rounded-t-md w-full"
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
              </View>
              <Text className="text-xs text-gray-600 mt-2">{day}</Text>
              <Text className="text-xs font-semibold text-gray-900">
                {dayData.workouts || '-'}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="mt-4 pt-4 border-t border-gray-100 flex-row justify-between">
        <View>
          <Text className="text-xs text-gray-500">Total Workouts</Text>
          <Text className="text-lg font-bold text-gray-900">
            {data.reduce((sum, d) => sum + d.workouts, 0)}
          </Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">Total Minutes</Text>
          <Text className="text-lg font-bold text-gray-900">
            {data.reduce((sum, d) => sum + d.minutes, 0)}
          </Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">Calories</Text>
          <Text className="text-lg font-bold text-gray-900">
            {data.reduce((sum, d) => sum + d.calories, 0)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
