import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCourses } from '@/hooks/useCourses';
import { useProgress } from '@/hooks/useProgress';
import { ProgressBar, Certificate } from '@/components';
import { Award, BookOpen, Clock, TrendingUp } from 'lucide-react-native';

export default function ProgressScreen() {
  const router = useRouter();
  const { data: courses } = useCourses();
  const { progress } = useProgress();

  const enrolledCourses = courses?.filter((course) => progress[course.id]) || [];
  const completedCourses = enrolledCourses.filter((course) => {
    const courseProgress = progress[course.id];
    return courseProgress?.completedLessons.length === course.lessonsCount;
  });

  const totalLessonsCompleted = Object.values(progress).reduce(
    (sum, p) => sum + p.completedLessons.length,
    0
  );

  const overallProgress =
    enrolledCourses.length > 0
      ? (completedCourses.length / enrolledCourses.length) * 100
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Progress
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 mb-6">
          Track your learning journey
        </Text>

        {/* Stats Cards */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="flex-1 min-w-[45%] bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl">
            <BookOpen size={24} color="#6366f1" />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {enrolledCourses.length}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">Enrolled</Text>
          </View>

          <View className="flex-1 min-w-[45%] bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
            <Award size={24} color="#22c55e" />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {completedCourses.length}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">Completed</Text>
          </View>

          <View className="flex-1 min-w-[45%] bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
            <TrendingUp size={24} color="#8b5cf6" />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {totalLessonsCompleted}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">Lessons</Text>
          </View>

          <View className="flex-1 min-w-[45%] bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
            <Clock size={24} color="#f59e0b" />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {Math.round(overallProgress)}%
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">Progress</Text>
          </View>
        </View>

        {/* Overall Progress */}
        {enrolledCourses.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Overall Progress
            </Text>
            <ProgressBar progress={overallProgress} testID="overall-progress" />
          </View>
        )}

        {/* Course Progress */}
        {enrolledCourses.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Course Progress
            </Text>
            {enrolledCourses.map((course) => {
              const courseProgress = progress[course.id];
              const percentage =
                (courseProgress.completedLessons.length / course.lessonsCount) * 100;

              return (
                <View
                  key={course.id}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-3 shadow-sm"
                  testID={`course-progress-${course.id}`}
                >
                  <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {courseProgress.completedLessons.length} of {course.lessonsCount} lessons
                    completed
                  </Text>
                  <ProgressBar progress={percentage} />
                </View>
              );
            })}
          </View>
        )}

        {/* Certificates */}
        {completedCourses.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Certificates
            </Text>
            {completedCourses.map((course) => (
              <View key={course.id} className="mb-4">
                <Certificate
                  courseName={course.title}
                  completedAt={progress[course.id].lastAccessedAt}
                  testID={`certificate-${course.id}`}
                />
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {enrolledCourses.length === 0 && (
          <View className="flex-1 items-center justify-center py-12">
            <BookOpen size={64} color="#94a3b8" />
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
              No courses yet
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-center mt-2">
              Start learning to track your progress
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
