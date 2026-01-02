import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CourseProgress } from '@/types';

interface ProgressState {
  progress: Record<string, CourseProgress>;
  completeLesson: (courseId: string, lessonId: string) => void;
  setCurrentLesson: (courseId: string, lessonId: string) => void;
  getCourseProgress: (courseId: string) => CourseProgress | undefined;
  saveQuizScore: (courseId: string, quizId: string, score: number) => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      completeLesson: (courseId, lessonId) =>
        set((state) => {
          const current = state.progress[courseId] || {
            courseId,
            completedLessons: [],
            currentLesson: null,
            percentComplete: 0,
            lastAccessedAt: new Date(),
            quizScores: {},
          };

          const completedLessons = current.completedLessons.includes(lessonId)
            ? current.completedLessons
            : [...current.completedLessons, lessonId];

          return {
            progress: {
              ...state.progress,
              [courseId]: {
                ...current,
                completedLessons,
                lastAccessedAt: new Date(),
              },
            },
          };
        }),

      setCurrentLesson: (courseId, lessonId) =>
        set((state) => {
          const current = state.progress[courseId] || {
            courseId,
            completedLessons: [],
            currentLesson: null,
            percentComplete: 0,
            lastAccessedAt: new Date(),
            quizScores: {},
          };

          return {
            progress: {
              ...state.progress,
              [courseId]: {
                ...current,
                currentLesson: lessonId,
                lastAccessedAt: new Date(),
              },
            },
          };
        }),

      getCourseProgress: (courseId) => {
        return get().progress[courseId];
      },

      saveQuizScore: (courseId, quizId, score) =>
        set((state) => {
          const current = state.progress[courseId] || {
            courseId,
            completedLessons: [],
            currentLesson: null,
            percentComplete: 0,
            lastAccessedAt: new Date(),
            quizScores: {},
          };

          return {
            progress: {
              ...state.progress,
              [courseId]: {
                ...current,
                quizScores: {
                  ...current.quizScores,
                  [quizId]: score,
                },
              },
            },
          };
        }),
    }),
    {
      name: 'course-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
