import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCourses } from '@/hooks/useCourses';
import { useProgress } from '@/hooks/useProgress';
import { CourseCard } from '@/components';
import { PlayCircle, TrendingUp } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useCourses();
  const { progress } = useProgress();

  const enrolledCourses = courses?.filter((course) => progress[course.id]) || [];
  const continueLesson = enrolledCourses.find((course) => {
    const courseProgress = progress[course.id];
    return courseProgress?.currentLesson;
  });

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
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back!
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            Continue your learning journey
          </Text>
        </View>

        {/* Continue Learning */}
        {continueLesson && (
          <View className="px-6 mb-8">
            <View className="flex-row items-center mb-4">
              <PlayCircle size={20} color="#6366f1" />
              <Text className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
                Continue Learning
              </Text>
            </View>
            <CourseCard
              course={continueLesson}
              onPress={() => router.push(`/courses/${continueLesson.id}`)}
              progress={
                (progress[continueLesson.id]?.completedLessons.length /
                  continueLesson.lessonsCount) *
                100
              }
              testID="continue-learning-card"
            />
          </View>
        )}

        {/* Enrolled Courses */}
        {enrolledCourses.length > 0 && (
          <View className="px-6 mb-8">
            <View className="flex-row items-center mb-4">
              <TrendingUp size={20} color="#6366f1" />
              <Text className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
                My Courses
              </Text>
            </View>
            {enrolledCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={() => router.push(`/courses/${course.id}`)}
                progress={
                  (progress[course.id]?.completedLessons.length / course.lessonsCount) * 100
                }
                testID={`enrolled-course-${course.id}`}
              />
            ))}
          </View>
        )}

        {/* Recommended Courses */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {enrolledCourses.length > 0 ? 'More Courses' : 'Start Learning'}
          </Text>
          {courses
            ?.filter((course) => !progress[course.id])
            .map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={() => router.push(`/courses/${course.id}`)}
                testID={`recommended-course-${course.id}`}
              />
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
