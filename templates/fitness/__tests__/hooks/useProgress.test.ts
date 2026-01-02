/**
 * Tests for useProgress hook (Zustand store)
 */

import { act } from '@testing-library/react-hooks';

// Mock zustand
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

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => date.toLocaleDateString()),
  startOfWeek: jest.fn((date) => date),
  isWithinInterval: jest.fn(() => true),
  differenceInDays: jest.fn(() => 1),
}));

// Import after mocks
import { useProgress } from '../../src/hooks/useProgress';

describe('useProgress', () => {
  beforeEach(() => {
    // Reset progress state before each test
    useProgress.setState({
      workoutLogs: [],
      goals: [],
      stats: {
        totalWorkouts: 0,
        thisWeek: 0,
        thisMonth: 0,
        streak: 0,
        longestStreak: 0,
        totalMinutes: 0,
        totalCalories: 0,
        averageWorkoutDuration: 0,
      },
      weeklyStats: [],
    });
  });

  const mockWorkoutLog = {
    id: 'log-1',
    workoutId: 'workout-1',
    workoutName: 'Full Body Strength',
    date: new Date(),
    duration: 45,
    caloriesBurned: 350,
    exercises: [],
  };

  const mockGoal = {
    id: 'goal-1',
    type: 'workouts-per-week' as const,
    target: 4,
    current: 0,
    startDate: new Date(),
    completed: false,
  };

  describe('addWorkoutLog', () => {
    it('should add a workout log', () => {
      const { addWorkoutLog } = useProgress.getState();

      act(() => {
        addWorkoutLog(mockWorkoutLog);
      });

      const state = useProgress.getState();
      expect(state.workoutLogs).toHaveLength(1);
      expect(state.workoutLogs[0].workoutName).toBe('Full Body Strength');
    });

    it('should update stats when adding workout log', () => {
      const { addWorkoutLog } = useProgress.getState();

      act(() => {
        addWorkoutLog(mockWorkoutLog);
      });

      const state = useProgress.getState();
      expect(state.stats.totalWorkouts).toBe(1);
      expect(state.stats.totalMinutes).toBe(45);
      expect(state.stats.totalCalories).toBe(350);
    });

    it('should accumulate multiple workout logs', () => {
      const { addWorkoutLog } = useProgress.getState();

      act(() => {
        addWorkoutLog(mockWorkoutLog);
        addWorkoutLog({
          ...mockWorkoutLog,
          id: 'log-2',
          duration: 30,
          caloriesBurned: 200,
        });
      });

      const state = useProgress.getState();
      expect(state.workoutLogs).toHaveLength(2);
      expect(state.stats.totalMinutes).toBe(75);
      expect(state.stats.totalCalories).toBe(550);
    });
  });

  describe('removeWorkoutLog', () => {
    it('should remove a workout log by id', () => {
      const { addWorkoutLog, removeWorkoutLog } = useProgress.getState();

      act(() => {
        addWorkoutLog(mockWorkoutLog);
      });

      expect(useProgress.getState().workoutLogs).toHaveLength(1);

      act(() => {
        removeWorkoutLog('log-1');
      });

      expect(useProgress.getState().workoutLogs).toHaveLength(0);
    });

    it('should update stats after removing workout log', () => {
      const { addWorkoutLog, removeWorkoutLog } = useProgress.getState();

      act(() => {
        addWorkoutLog(mockWorkoutLog);
      });

      expect(useProgress.getState().stats.totalMinutes).toBe(45);

      act(() => {
        removeWorkoutLog('log-1');
      });

      expect(useProgress.getState().stats.totalMinutes).toBe(0);
    });

    it('should only remove specified log', () => {
      const { addWorkoutLog, removeWorkoutLog } = useProgress.getState();

      act(() => {
        addWorkoutLog(mockWorkoutLog);
        addWorkoutLog({
          ...mockWorkoutLog,
          id: 'log-2',
          workoutName: 'HIIT',
        });
      });

      act(() => {
        removeWorkoutLog('log-1');
      });

      const state = useProgress.getState();
      expect(state.workoutLogs).toHaveLength(1);
      expect(state.workoutLogs[0].workoutName).toBe('HIIT');
    });
  });

  describe('updateStats', () => {
    it('should recalculate stats', () => {
      const { addWorkoutLog, updateStats } = useProgress.getState();

      act(() => {
        addWorkoutLog(mockWorkoutLog);
      });

      // Manually trigger stats update
      act(() => {
        updateStats();
      });

      const state = useProgress.getState();
      expect(state.stats.totalWorkouts).toBe(1);
    });
  });

  describe('goals management', () => {
    describe('addGoal', () => {
      it('should add a goal', () => {
        const { addGoal } = useProgress.getState();

        act(() => {
          addGoal(mockGoal);
        });

        expect(useProgress.getState().goals).toHaveLength(1);
        expect(useProgress.getState().goals[0].type).toBe('workouts-per-week');
      });
    });

    describe('updateGoal', () => {
      it('should update goal progress', () => {
        const { addGoal, updateGoal } = useProgress.getState();

        act(() => {
          addGoal(mockGoal);
        });

        act(() => {
          updateGoal('goal-1', { current: 2 });
        });

        expect(useProgress.getState().goals[0].current).toBe(2);
      });

      it('should mark goal as completed', () => {
        const { addGoal, updateGoal } = useProgress.getState();

        act(() => {
          addGoal(mockGoal);
        });

        act(() => {
          updateGoal('goal-1', { current: 4, completed: true });
        });

        const goal = useProgress.getState().goals[0];
        expect(goal.current).toBe(4);
        expect(goal.completed).toBe(true);
      });

      it('should only update specified goal', () => {
        const { addGoal, updateGoal } = useProgress.getState();

        act(() => {
          addGoal(mockGoal);
          addGoal({
            ...mockGoal,
            id: 'goal-2',
            type: 'minutes-per-week' as const,
            target: 180,
          });
        });

        act(() => {
          updateGoal('goal-1', { current: 3 });
        });

        const goals = useProgress.getState().goals;
        expect(goals[0].current).toBe(3);
        expect(goals[1].current).toBe(0);
      });
    });

    describe('removeGoal', () => {
      it('should remove a goal by id', () => {
        const { addGoal, removeGoal } = useProgress.getState();

        act(() => {
          addGoal(mockGoal);
        });

        act(() => {
          removeGoal('goal-1');
        });

        expect(useProgress.getState().goals).toHaveLength(0);
      });

      it('should only remove specified goal', () => {
        const { addGoal, removeGoal } = useProgress.getState();

        act(() => {
          addGoal(mockGoal);
          addGoal({
            ...mockGoal,
            id: 'goal-2',
            type: 'minutes-per-week' as const,
          });
        });

        act(() => {
          removeGoal('goal-1');
        });

        const goals = useProgress.getState().goals;
        expect(goals).toHaveLength(1);
        expect(goals[0].id).toBe('goal-2');
      });
    });
  });

  describe('stats calculations', () => {
    it('should calculate average workout duration', () => {
      const { addWorkoutLog } = useProgress.getState();

      act(() => {
        addWorkoutLog({ ...mockWorkoutLog, duration: 30 });
        addWorkoutLog({ ...mockWorkoutLog, id: 'log-2', duration: 60 });
      });

      const state = useProgress.getState();
      expect(state.stats.averageWorkoutDuration).toBe(45); // (30 + 60) / 2
    });

    it('should handle empty workout logs', () => {
      const state = useProgress.getState();
      expect(state.stats.totalWorkouts).toBe(0);
      expect(state.stats.averageWorkoutDuration).toBe(0);
    });
  });
});
