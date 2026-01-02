import { create } from 'zustand';
import { WorkoutLog, ProgressStats, WeeklyStats, Goal } from '@/types';
import { format, startOfWeek, isWithinInterval, differenceInDays } from 'date-fns';

interface ProgressState {
  workoutLogs: WorkoutLog[];
  goals: Goal[];
  stats: ProgressStats;
  weeklyStats: WeeklyStats[];

  // Actions
  addWorkoutLog: (log: WorkoutLog) => void;
  removeWorkoutLog: (id: string) => void;
  updateStats: () => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
}

// Mock initial data
const INITIAL_WORKOUT_LOGS: WorkoutLog[] = [
  {
    id: '1',
    workoutId: '1',
    workoutName: 'Full Body Strength',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    duration: 58,
    caloriesBurned: 450,
    exercises: [
      {
        exerciseId: '1',
        exerciseName: 'Barbell Squat',
        completed: true,
        sets: [
          { setNumber: 1, reps: 10, weight: 60, completed: true },
          { setNumber: 2, reps: 10, weight: 60, completed: true },
          { setNumber: 3, reps: 8, weight: 65, completed: true },
        ],
      },
    ],
  },
  {
    id: '2',
    workoutId: '4',
    workoutName: 'Beginner HIIT',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    duration: 26,
    caloriesBurned: 280,
    exercises: [],
  },
  {
    id: '3',
    workoutId: '5',
    workoutName: 'Core & Abs Blast',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    duration: 32,
    caloriesBurned: 200,
    exercises: [],
  },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: '1',
    type: 'workouts-per-week',
    target: 4,
    current: 3,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    completed: false,
  },
  {
    id: '2',
    type: 'minutes-per-week',
    target: 180,
    current: 116,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    completed: false,
  },
];

function calculateStats(logs: WorkoutLog[]): ProgressStats {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const thisWeekLogs = logs.filter((log) => log.date >= weekAgo);
  const thisMonthLogs = logs.filter((log) => log.date >= monthAgo);

  // Calculate streak
  const sortedLogs = [...logs].sort((a, b) => b.date.getTime() - a.date.getTime());
  let streak = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  for (const log of sortedLogs) {
    if (!lastDate) {
      currentStreak = 1;
      lastDate = log.date;
    } else {
      const daysDiff = differenceInDays(lastDate, log.date);
      if (daysDiff === 1) {
        currentStreak++;
      } else if (daysDiff > 1) {
        break;
      }
      lastDate = log.date;
    }
  }

  streak = currentStreak;

  // Calculate longest streak
  let tempStreak = 0;
  lastDate = null;
  for (const log of sortedLogs) {
    if (!lastDate) {
      tempStreak = 1;
      lastDate = log.date;
    } else {
      const daysDiff = differenceInDays(lastDate, log.date);
      if (daysDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
      lastDate = log.date;
    }
  }

  const totalMinutes = logs.reduce((sum, log) => sum + log.duration, 0);
  const totalCalories = logs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

  return {
    totalWorkouts: logs.length,
    thisWeek: thisWeekLogs.length,
    thisMonth: thisMonthLogs.length,
    streak,
    longestStreak: Math.max(longestStreak, streak),
    totalMinutes,
    totalCalories,
    averageWorkoutDuration: logs.length > 0 ? totalMinutes / logs.length : 0,
  };
}

export const useProgress = create<ProgressState>((set, get) => ({
  workoutLogs: INITIAL_WORKOUT_LOGS,
  goals: INITIAL_GOALS,
  stats: calculateStats(INITIAL_WORKOUT_LOGS),
  weeklyStats: [],

  addWorkoutLog: (log: WorkoutLog) => {
    set((state) => {
      const newLogs = [...state.workoutLogs, log];
      return {
        workoutLogs: newLogs,
        stats: calculateStats(newLogs),
      };
    });
  },

  removeWorkoutLog: (id: string) => {
    set((state) => {
      const newLogs = state.workoutLogs.filter((log) => log.id !== id);
      return {
        workoutLogs: newLogs,
        stats: calculateStats(newLogs),
      };
    });
  },

  updateStats: () => {
    set((state) => ({
      stats: calculateStats(state.workoutLogs),
    }));
  },

  addGoal: (goal: Goal) => {
    set((state) => ({
      goals: [...state.goals, goal],
    }));
  },

  updateGoal: (id: string, updates: Partial<Goal>) => {
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, ...updates } : goal
      ),
    }));
  },

  removeGoal: (id: string) => {
    set((state) => ({
      goals: state.goals.filter((goal) => goal.id !== id),
    }));
  },
}));
