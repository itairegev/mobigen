import { View, Text } from 'react-native';
import { Target, TrendingUp } from 'lucide-react-native';
import { Goal } from '@/types';
import { Card } from './Card';

interface GoalProgressProps {
  goal: Goal;
  testID?: string;
}

export function GoalProgress({ goal, testID }: GoalProgressProps) {
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  const isCompleted = goal.completed || progress >= 100;

  const goalLabels = {
    'workouts-per-week': 'Workouts per Week',
    'minutes-per-week': 'Minutes per Week',
    'weight-loss': 'Weight Loss (kg)',
    'strength-gain': 'Strength Gain (%)',
  };

  return (
    <Card className="p-4 mb-3" testID={testID}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className={`p-2 rounded-full ${isCompleted ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <Target size={20} color={isCompleted ? '#10b981' : '#6b7280'} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {goalLabels[goal.type]}
            </Text>
            <Text className="text-sm text-gray-600">
              {goal.current} / {goal.target}
            </Text>
          </View>
        </View>

        {isCompleted && (
          <View className="bg-primary-50 rounded-full px-3 py-1">
            <Text className="text-xs font-bold text-primary-700">Achieved!</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View className="bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
        <View
          className={`h-full rounded-full ${
            isCompleted ? 'bg-primary-500' : 'bg-secondary-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-600">{Math.round(progress)}% complete</Text>
        {!isCompleted && (
          <View className="flex-row items-center">
            <TrendingUp size={12} color="#10b981" />
            <Text className="text-xs text-primary-600 ml-1 font-medium">
              {goal.target - goal.current} to go
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}
