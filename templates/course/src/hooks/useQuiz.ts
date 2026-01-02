import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQuiz } from '@/services/courses';
import { Answer, Question } from '@/types';

export function useQuiz(lessonId: string) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quizzes', lessonId],
    queryFn: () => getQuiz(lessonId),
    enabled: !!lessonId,
  });

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  const answerQuestion = (selectedOption: number) => {
    if (!currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect,
    };

    setAnswers([...answers, newAnswer]);

    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };

  const hasPassed = () => {
    if (!quiz) return false;
    return calculateScore() >= quiz.passingScore;
  };

  const reset = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setIsComplete(false);
  };

  return {
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
  };
}
