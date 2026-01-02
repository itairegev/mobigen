import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Course } from '@/types';
import { Star, Clock, Users } from 'lucide-react-native';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  progress?: number;
  testID?: string;
}

export function CourseCard({ course, onPress, progress, testID }: CourseCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden mb-4 shadow-sm"
      testID={testID}
    >
      <Image source={{ uri: course.thumbnail }} className="w-full h-48" />
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
            {course.category}
          </Text>
          <View className="flex-row items-center">
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
              {course.rating} ({course.studentsCount.toLocaleString()})
            </Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {course.title}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3" numberOfLines={2}>
          {course.description}
        </Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Clock size={14} color="#64748b" />
            <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
              {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </Text>
            <Text className="text-xs text-gray-600 dark:text-gray-400 mx-2">•</Text>
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              {course.lessonsCount} lessons
            </Text>
          </View>

          <Text className="text-sm font-bold text-gray-900 dark:text-white">
            ${course.price}
          </Text>
        </View>

        {progress !== undefined && progress > 0 && (
          <View className="mt-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs text-gray-600 dark:text-gray-400">Progress</Text>
              <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                {Math.round(progress)}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary-600 dark:bg-primary-400"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
