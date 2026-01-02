import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Clock, Flame, Dumbbell } from 'lucide-react-native';
import { Workout } from '@/types';
import { Card } from './Card';

interface WorkoutCardProps {
  workout: Workout;
  onPress: () => void;
  testID?: string;
}

export function WorkoutCard({ workout, onPress, testID }: WorkoutCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 border-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    advanced: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <TouchableOpacity onPress={onPress} testID={testID}>
      <Card className="mb-4 overflow-hidden">
        {workout.image && (
          <Image
            source={{ uri: workout.image }}
            className="w-full h-36"
            resizeMode="cover"
          />
        )}

        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
              {workout.name}
            </Text>
            <View
              className={`px-2 py-1 rounded-full border ${difficultyColors[workout.difficulty]}`}
            >
              <Text className="text-xs font-medium capitalize">
                {workout.difficulty}
              </Text>
            </View>
          </View>

          <Text className="text-gray-600 mb-3 leading-5" numberOfLines={2}>
            {workout.description}
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Clock size={18} color="#10b981" />
              <Text className="text-sm text-gray-700 ml-1 font-medium">
                {workout.duration} min
              </Text>
            </View>

            <View className="flex-row items-center">
              <Dumbbell size={18} color="#10b981" />
              <Text className="text-sm text-gray-700 ml-1 font-medium">
                {workout.exercises.length} exercises
              </Text>
            </View>

            {workout.caloriesBurned && (
              <View className="flex-row items-center">
                <Flame size={18} color="#f59e0b" />
                <Text className="text-sm text-gray-700 ml-1 font-medium">
                  {workout.caloriesBurned} cal
                </Text>
              </View>
            )}
          </View>

          <View className="mt-3 bg-primary-50 rounded-lg px-3 py-2">
            <Text className="text-xs text-primary-700 font-medium capitalize text-center">
              {workout.category.replace('-', ' ')}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
