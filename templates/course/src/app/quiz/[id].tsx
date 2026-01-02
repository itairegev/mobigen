import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuiz } from '@/hooks/useQuiz';
import { useLesson } from '@/hooks/useLessons';
import { useProgress } from '@/hooks/useProgress';
import { QuizQuestion } from '@/components';
import { Award, XCircle, RefreshCw } from 'lucide-react-native';

export default function QuizScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lesson } = useLesson(id);
  const {
    quiz,
    isLoading,
    currentQuestion,
    currentQuestionIndex,
    answers,
    isComplete,
    answerQuestion,
    calculateScore,
    hasPassed,
    reset,
  } = useQuiz(id);
  const { saveQuizScore } = useProgress();

  const handleComplete = () => {
    const score = calculateScore();
    if (lesson) {
      saveQuizScore(lesson.courseId, quiz!.id, score);
    }
    router.back();
  };

  if (isLoading || !quiz || !currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    const score = calculateScore();
    const passed = hasPassed();

    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
        <View className="flex-1 p-6">
          {/* Results */}
          <View className="flex-1 items-center justify-center">
            {passed ? (
              <Award size={80} color="#22c55e" />
            ) : (
              <XCircle size={80} color="#ef4444" />
            )}

            <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
              {passed ? 'Congratulations!' : 'Keep Practicing'}
            </Text>

            <Text className="text-6xl font-bold text-primary-600 dark:text-primary-400 my-4">
              {score}%
            </Text>

            <Text className="text-lg text-gray-600 dark:text-gray-400 text-center mb-2">
              You scored {score}% on this quiz
            </Text>

            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
              Passing score: {quiz.passingScore}%
            </Text>

            {/* Answer Review */}
            <View className="w-full mb-6">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Review Answers
              </Text>
              <View className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600 dark:text-gray-400">Correct</Text>
                  <Text className="font-semibold text-green-600 dark:text-green-400">
                    {answers.filter((a) => a.isCorrect).length} / {quiz.questions.length}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600 dark:text-gray-400">Incorrect</Text>
                  <Text className="font-semibold text-red-600 dark:text-red-400">
                    {answers.filter((a) => !a.isCorrect).length} / {quiz.questions.length}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3">
            {!passed && (
              <TouchableOpacity
                onPress={reset}
                className="bg-primary-600 p-4 rounded-xl flex-row items-center justify-center"
                testID="retry-button"
              >
                <RefreshCw size={24} color="#fff" />
                <Text className="text-white text-lg font-bold ml-2">
                  Try Again
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleComplete}
              className={`p-4 rounded-xl flex-row items-center justify-center ${
                passed
                  ? 'bg-green-600'
                  : 'bg-gray-200 dark:bg-slate-700'
              }`}
              testID="continue-button"
            >
              <Text
                className={`text-lg font-bold ${
                  passed ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {passed ? 'Continue Learning' : 'Back to Course'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScrollView className="flex-1 p-6">
        {/* Quiz Header */}
        <View className="mb-6">
          <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Text>
          <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-600"
              style={{
                width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </View>
        </View>

        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {quiz.title}
        </Text>

        {/* Question */}
        <QuizQuestion
          question={currentQuestion}
          onSelectOption={answerQuestion}
          testID={`question-${currentQuestionIndex}`}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
