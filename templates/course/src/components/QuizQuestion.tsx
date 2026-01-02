import { View, Text, TouchableOpacity } from 'react-native';
import { Question } from '@/types';

interface QuizQuestionProps {
  question: Question;
  onSelectOption: (index: number) => void;
  selectedOption?: number;
  showAnswer?: boolean;
  testID?: string;
}

export function QuizQuestion({
  question,
  onSelectOption,
  selectedOption,
  showAnswer,
  testID,
}: QuizQuestionProps) {
  return (
    <View className="mb-6" testID={testID}>
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {question.question}
      </Text>

      {question.options.map((option, index) => {
        const isSelected = selectedOption === index;
        const isCorrect = index === question.correctAnswer;
        const showCorrect = showAnswer && isCorrect;
        const showIncorrect = showAnswer && isSelected && !isCorrect;

        return (
          <TouchableOpacity
            key={index}
            onPress={() => !showAnswer && onSelectOption(index)}
            disabled={showAnswer}
            className={`p-4 mb-3 rounded-lg border-2 ${
              showCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : showIncorrect
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : isSelected
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800'
            }`}
            testID={`quiz-option-${index}`}
          >
            <View className="flex-row items-center">
              <View
                className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                  showCorrect
                    ? 'border-green-500 bg-green-500'
                    : showIncorrect
                    ? 'border-red-500 bg-red-500'
                    : isSelected
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-gray-400 dark:border-gray-500'
                }`}
              >
                {(isSelected || showCorrect) && (
                  <View className="w-2 h-2 rounded-full bg-white" />
                )}
              </View>
              <Text
                className={`flex-1 text-base ${
                  showCorrect || showIncorrect
                    ? 'font-semibold'
                    : 'text-gray-900 dark:text-white'
                } ${showCorrect ? 'text-green-700 dark:text-green-400' : ''} ${
                  showIncorrect ? 'text-red-700 dark:text-red-400' : ''
                }`}
              >
                {option}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {showAnswer && question.explanation && (
        <View className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Text className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
            Explanation
          </Text>
          <Text className="text-sm text-blue-800 dark:text-blue-400">
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
}
