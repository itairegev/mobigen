import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCourse, useCourseLessons } from '@/hooks/useCourses';
import { useProgress } from '@/hooks/useProgress';
import { LessonItem, ProgressBar } from '@/components';
import { Star, Clock, Users, Award, PlayCircle } from 'lucide-react-native';

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(id);
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(id);
  const { progress, setCurrentLesson } = useProgress();

  const courseProgress = progress[id];
  const completedLessons = courseProgress?.completedLessons || [];
  const percentComplete = course
    ? (completedLessons.length / course.lessonsCount) * 100
    : 0;

  const handleLessonPress = (lessonId: string) => {
    setCurrentLesson(id, lessonId);
    router.push(`/lessons/${lessonId}`);
  };

  if (courseLoading || lessonsLoading || !course || !lessons) {
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
        {/* Course Header */}
        <Image source={{ uri: course.thumbnail }} className="w-full h-64" />

        <View className="p-6">
          {/* Category & Rating */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase">
              {course.category}
            </Text>
            <View className="flex-row items-center">
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-sm font-semibold text-gray-900 dark:text-white ml-1">
                {course.rating}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                ({course.studentsCount.toLocaleString()} students)
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {course.title}
          </Text>

          {/* Description */}
          <Text className="text-base text-gray-600 dark:text-gray-400 mb-4">
            {course.description}
          </Text>

          {/* Instructor */}
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mr-3">
              <Text className="text-gray-600 dark:text-gray-400 font-semibold">
                {course.instructor.charAt(0)}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400">Instructor</Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                {course.instructor}
              </Text>
            </View>
          </View>

          {/* Course Stats */}
          <View className="flex-row flex-wrap gap-4 mb-6">
            <View className="flex-row items-center">
              <Clock size={16} color="#64748b" />
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {Math.floor(course.duration / 60)}h {course.duration % 60}m
              </Text>
            </View>
            <View className="flex-row items-center">
              <PlayCircle size={16} color="#64748b" />
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {course.lessonsCount} lessons
              </Text>
            </View>
            <View className="flex-row items-center">
              <Award size={16} color="#64748b" />
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {course.level}
              </Text>
            </View>
          </View>

          {/* Progress */}
          {courseProgress && (
            <View className="mb-6">
              <ProgressBar
                progress={percentComplete}
                label="Your Progress"
                testID="course-progress"
              />
            </View>
          )}

          {/* Lessons */}
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Course Content
          </Text>
          <View className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                isCompleted={completedLessons.includes(lesson.id)}
                onPress={() => handleLessonPress(lesson.id)}
                testID={`lesson-${lesson.id}`}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Enroll Button */}
      {!courseProgress && (
        <View className="p-6 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            onPress={() => {
              const firstLesson = lessons[0];
              if (firstLesson) {
                handleLessonPress(firstLesson.id);
              }
            }}
            className="bg-primary-600 p-4 rounded-xl items-center"
            testID="enroll-button"
          >
            <Text className="text-white text-lg font-bold">
              Enroll for ${course.price}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
