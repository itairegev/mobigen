/**
 * Tests for useProgress hook (Zustand store with persistence)
 */

import { act } from '@testing-library/react-hooks';

// Mock zustand with persist middleware
jest.mock('zustand', () => ({
  create: jest.fn((createState) => {
    let state = createState(
      (newState: any) => {
        state = typeof newState === 'function' ? newState(state) : { ...state, ...newState };
      },
      () => state,
      {} as any
    );

    const useStore = (selector?: (s: typeof state) => any) => {
      return selector ? selector(state) : state;
    };

    useStore.getState = () => state;
    useStore.setState = (newState: any) => {
      state = typeof newState === 'function' ? newState(state) : { ...state, ...newState };
    };

    return useStore;
  }),
}));

// Mock zustand/middleware
jest.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
  createJSONStorage: () => ({}),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

// Import after mocks
import { useProgress } from '../../src/hooks/useProgress';

describe('useProgress', () => {
  beforeEach(() => {
    // Reset progress state before each test
    useProgress.setState({
      progress: {},
    });
  });

  describe('completeLesson', () => {
    it('should mark a lesson as complete', () => {
      const { completeLesson } = useProgress.getState();

      act(() => {
        completeLesson('course-1', 'lesson-1');
      });

      const state = useProgress.getState();
      expect(state.progress['course-1'].completedLessons).toContain('lesson-1');
    });

    it('should create progress record if not exists', () => {
      const { completeLesson } = useProgress.getState();

      expect(useProgress.getState().progress['course-1']).toBeUndefined();

      act(() => {
        completeLesson('course-1', 'lesson-1');
      });

      expect(useProgress.getState().progress['course-1']).toBeDefined();
      expect(useProgress.getState().progress['course-1'].courseId).toBe('course-1');
    });

    it('should not duplicate completed lessons', () => {
      const { completeLesson } = useProgress.getState();

      act(() => {
        completeLesson('course-1', 'lesson-1');
        completeLesson('course-1', 'lesson-1');
      });

      const state = useProgress.getState();
      const count = state.progress['course-1'].completedLessons.filter(
        (l: string) => l === 'lesson-1'
      ).length;
      expect(count).toBe(1);
    });

    it('should track multiple completed lessons', () => {
      const { completeLesson } = useProgress.getState();

      act(() => {
        completeLesson('course-1', 'lesson-1');
        completeLesson('course-1', 'lesson-2');
        completeLesson('course-1', 'lesson-3');
      });

      const state = useProgress.getState();
      expect(state.progress['course-1'].completedLessons).toHaveLength(3);
    });

    it('should update lastAccessedAt', () => {
      const { completeLesson } = useProgress.getState();
      const beforeTime = new Date();

      act(() => {
        completeLesson('course-1', 'lesson-1');
      });

      const state = useProgress.getState();
      const accessTime = new Date(state.progress['course-1'].lastAccessedAt);
      expect(accessTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('setCurrentLesson', () => {
    it('should set the current lesson', () => {
      const { setCurrentLesson } = useProgress.getState();

      act(() => {
        setCurrentLesson('course-1', 'lesson-5');
      });

      const state = useProgress.getState();
      expect(state.progress['course-1'].currentLesson).toBe('lesson-5');
    });

    it('should create progress record if not exists', () => {
      const { setCurrentLesson } = useProgress.getState();

      act(() => {
        setCurrentLesson('course-2', 'lesson-1');
      });

      expect(useProgress.getState().progress['course-2']).toBeDefined();
    });

    it('should update current lesson for existing course', () => {
      const { setCurrentLesson } = useProgress.getState();

      act(() => {
        setCurrentLesson('course-1', 'lesson-1');
      });

      expect(useProgress.getState().progress['course-1'].currentLesson).toBe('lesson-1');

      act(() => {
        setCurrentLesson('course-1', 'lesson-3');
      });

      expect(useProgress.getState().progress['course-1'].currentLesson).toBe('lesson-3');
    });
  });

  describe('getCourseProgress', () => {
    it('should return undefined for unknown course', () => {
      const { getCourseProgress } = useProgress.getState();
      expect(getCourseProgress('unknown-course')).toBeUndefined();
    });

    it('should return progress for known course', () => {
      const { completeLesson, getCourseProgress } = useProgress.getState();

      act(() => {
        completeLesson('course-1', 'lesson-1');
      });

      const progress = useProgress.getState().getCourseProgress('course-1');
      expect(progress).toBeDefined();
      expect(progress?.courseId).toBe('course-1');
    });
  });

  describe('saveQuizScore', () => {
    it('should save quiz score', () => {
      const { saveQuizScore } = useProgress.getState();

      act(() => {
        saveQuizScore('course-1', 'quiz-1', 85);
      });

      const state = useProgress.getState();
      expect(state.progress['course-1'].quizScores['quiz-1']).toBe(85);
    });

    it('should create progress record if not exists', () => {
      const { saveQuizScore } = useProgress.getState();

      act(() => {
        saveQuizScore('course-3', 'quiz-1', 90);
      });

      expect(useProgress.getState().progress['course-3']).toBeDefined();
    });

    it('should update existing quiz score', () => {
      const { saveQuizScore } = useProgress.getState();

      act(() => {
        saveQuizScore('course-1', 'quiz-1', 70);
      });

      expect(useProgress.getState().progress['course-1'].quizScores['quiz-1']).toBe(70);

      act(() => {
        saveQuizScore('course-1', 'quiz-1', 95);
      });

      expect(useProgress.getState().progress['course-1'].quizScores['quiz-1']).toBe(95);
    });

    it('should track multiple quiz scores', () => {
      const { saveQuizScore } = useProgress.getState();

      act(() => {
        saveQuizScore('course-1', 'quiz-1', 80);
        saveQuizScore('course-1', 'quiz-2', 90);
        saveQuizScore('course-1', 'quiz-3', 100);
      });

      const scores = useProgress.getState().progress['course-1'].quizScores;
      expect(scores['quiz-1']).toBe(80);
      expect(scores['quiz-2']).toBe(90);
      expect(scores['quiz-3']).toBe(100);
    });
  });

  describe('multiple courses', () => {
    it('should track progress independently per course', () => {
      const { completeLesson, setCurrentLesson, saveQuizScore } = useProgress.getState();

      act(() => {
        // Course 1
        completeLesson('course-1', 'lesson-1');
        completeLesson('course-1', 'lesson-2');
        setCurrentLesson('course-1', 'lesson-3');
        saveQuizScore('course-1', 'quiz-1', 80);

        // Course 2
        completeLesson('course-2', 'lesson-1');
        setCurrentLesson('course-2', 'lesson-2');
        saveQuizScore('course-2', 'quiz-1', 100);
      });

      const state = useProgress.getState();

      // Verify course 1
      expect(state.progress['course-1'].completedLessons).toHaveLength(2);
      expect(state.progress['course-1'].currentLesson).toBe('lesson-3');
      expect(state.progress['course-1'].quizScores['quiz-1']).toBe(80);

      // Verify course 2
      expect(state.progress['course-2'].completedLessons).toHaveLength(1);
      expect(state.progress['course-2'].currentLesson).toBe('lesson-2');
      expect(state.progress['course-2'].quizScores['quiz-1']).toBe(100);
    });
  });
});
