import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Exercise } from '@/types';
import { Card } from './Card';

interface ExerciseItemProps {
  exercise: Exercise;
  sets?: number;
  reps?: number;
  duration?: number;
  onPress?: () => void;
  testID?: string;
}

export function ExerciseItem({
  exercise,
  sets,
  reps,
  duration,
  onPress,
  testID,
}: ExerciseItemProps) {
  const difficultyColors = {
    beginner: 'text-green-600',
    intermediate: 'text-yellow-600',
    advanced: 'text-red-600',
  };

  const content = (
    <View className="flex-row items-center p-4">
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">
          {exercise.name}
        </Text>

        <View className="flex-row flex-wrap items-center gap-2 mb-2">
          {sets && (
            <Text className="text-sm text-gray-600">
              {sets} sets
              {reps && ` × ${reps} reps`}
              {duration && ` × ${duration}s`}
            </Text>
          )}
        </View>

        <View className="flex-row flex-wrap gap-1">
          {exercise.muscleGroups.slice(0, 3).map((muscle, idx) => (
            <View key={idx} className="bg-gray-100 rounded-full px-2 py-1">
              <Text className="text-xs text-gray-700">{muscle}</Text>
            </View>
          ))}
        </View>

        {exercise.equipment && exercise.equipment.length > 0 && (
          <Text className="text-xs text-gray-500 mt-2">
            Equipment: {exercise.equipment.join(', ')}
          </Text>
        )}
      </View>

      {onPress && (
        <ChevronRight size={20} color="#9ca3af" />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Card className="mb-3">{content}</Card>
      </TouchableOpacity>
    );
  }

  return <Card className="mb-3">{content}</Card>;
}
