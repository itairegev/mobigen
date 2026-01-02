import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useCourses } from '@/hooks/useCourses';
import { useProgress } from '@/hooks/useProgress';
import { CourseCard } from '@/components';

const CATEGORIES = ['All', 'Mobile Development', 'Programming', 'Design', 'Backend'];

export default function CoursesScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useCourses();
  const { progress } = useProgress();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredCourses =
    selectedCategory === 'All'
      ? courses
      : courses?.filter((course) => course.category === selectedCategory);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 py-4">
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            className={`px-4 py-2 mr-2 rounded-full ${
              selectedCategory === category
                ? 'bg-primary-600'
                : 'bg-gray-200 dark:bg-slate-700'
            }`}
            testID={`category-${category}`}
          >
            <Text
              className={`font-semibold ${
                selectedCategory === category
                  ? 'text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Courses List */}
      <ScrollView className="flex-1 px-6">
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {filteredCourses?.length} courses
        </Text>
        {filteredCourses?.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onPress={() => router.push(`/courses/${course.id}`)}
            progress={
              progress[course.id]
                ? (progress[course.id].completedLessons.length / course.lessonsCount) * 100
                : undefined
            }
            testID={`course-${course.id}`}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
