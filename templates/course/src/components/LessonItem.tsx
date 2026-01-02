import { View, Text, TouchableOpacity } from 'react-native';
import { Lesson } from '@/types';
import { PlayCircle, CheckCircle, Lock, Clock } from 'lucide-react-native';

interface LessonItemProps {
  lesson: Lesson;
  isCompleted: boolean;
  onPress: () => void;
  testID?: string;
}

export function LessonItem({ lesson, isCompleted, onPress, testID }: LessonItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={lesson.isLocked}
      className={`flex-row items-center p-4 border-b border-gray-200 dark:border-gray-700 ${
        lesson.isLocked ? 'opacity-50' : ''
      }`}
      testID={testID}
    >
      <View className="mr-4">
        {lesson.isLocked ? (
          <Lock size={24} color="#94a3b8" />
        ) : isCompleted ? (
          <CheckCircle size={24} color="#22c55e" fill="#22c55e" />
        ) : (
          <PlayCircle size={24} color="#6366f1" />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            Lesson {lesson.order}
          </Text>
          {lesson.isLocked && (
            <View className="flex-row items-center">
              <Lock size={12} color="#94a3b8" />
              <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">Locked</Text>
            </View>
          )}
        </View>
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {lesson.title}
        </Text>
        <View className="flex-row items-center">
          <Clock size={12} color="#64748b" />
          <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
            {lesson.duration} min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
