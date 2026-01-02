// Fitness Class Types
export interface FitnessClass {
  id: string;
  name: string;
  description: string;
  instructor: string;
  instructorImage?: string;
  duration: number; // minutes
  capacity: number;
  enrolled: number;
  datetime: Date;
  location: string;
  category: 'yoga' | 'hiit' | 'strength' | 'cardio' | 'pilates' | 'spin' | 'crossfit';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  image?: string;
}

// Workout Types
export interface Workout {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: WorkoutExercise[];
  category: string;
  image?: string;
  caloriesBurned?: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  duration?: number; // seconds for timed exercises
  restTime: number; // seconds
  notes?: string;
}

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  equipment?: string[];
  instructions: string[];
  image?: string;
  video?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'flexibility' | 'balance';
}

// Workout Log Types
export interface WorkoutLog {
  id: string;
  workoutId?: string;
  workoutName: string;
  date: Date;
  duration: number; // minutes
  exercises: ExerciseLog[];
  notes?: string;
  caloriesBurned?: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  completed: boolean;
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weight?: number; // kg or lbs
  duration?: number; // seconds for timed exercises
  completed: boolean;
}

// Progress & Stats Types
export interface ProgressStats {
  totalWorkouts: number;
  thisWeek: number;
  thisMonth: number;
  streak: number; // consecutive days
  longestStreak: number;
  totalMinutes: number;
  totalCalories: number;
  averageWorkoutDuration: number;
  favoriteCategory?: string;
}

export interface WeeklyStats {
  week: string; // ISO week format
  workouts: number;
  minutes: number;
  calories: number;
}

export interface Goal {
  id: string;
  type: 'workouts-per-week' | 'minutes-per-week' | 'weight-loss' | 'strength-gain';
  target: number;
  current: number;
  startDate: Date;
  endDate?: Date;
  completed: boolean;
}

// Booking Types
export interface ClassBooking {
  id: string;
  classId: string;
  userId: string;
  status: 'booked' | 'attended' | 'cancelled';
  bookedAt: Date;
}

// Filter Types
export type ClassCategory = FitnessClass['category'] | 'all';
export type ClassDifficulty = FitnessClass['difficulty'] | 'all';
export type WorkoutCategory = 'all' | 'strength' | 'cardio' | 'flexibility' | 'full-body' | 'upper-body' | 'lower-body';
