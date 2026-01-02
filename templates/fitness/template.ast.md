## Template: fitness

### Screens (11)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Calendar, Dumbbell...
- **ClassesScreen** (src/app/(tabs)/classes.tsx)
  - Hooks: useState, useClasses
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useProgress
  - JSX: SafeAreaView, ScrollView, View, Text, StreakBadge...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - JSX: SafeAreaView, ScrollView, View, Card, User...
- **ProgressScreen** (src/app/(tabs)/progress.tsx)
  - Hooks: useProgress
  - JSX: SafeAreaView, ScrollView, View, Text, StreakBadge...
- **WorkoutsScreen** (src/app/(tabs)/workouts.tsx)
  - Hooks: useState, useWorkouts
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **ClassDetailScreen** (src/app/classes/[id].tsx)
  - Hooks: useLocalSearchParams, useClass, useState
  - JSX: SafeAreaView, ActivityIndicator, Text, Button, ScrollView...
- **ExerciseDetailScreen** (src/app/exercises/[id].tsx)
  - Hooks: useLocalSearchParams, useExercise
  - JSX: SafeAreaView, ActivityIndicator, Text, Button, ScrollView...
- **LogWorkoutScreen** (src/app/log-workout.tsx)
  - Hooks: useProgress, useState
  - JSX: SafeAreaView, ScrollView, View, Text, Card...
- **WorkoutDetailScreen** (src/app/workouts/[id].tsx)
  - Hooks: useLocalSearchParams, useWorkout, useExercises
  - JSX: SafeAreaView, ActivityIndicator, Text, Button, ScrollView...

### Components (11)
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 1 elements
- **ClassCard**: 0 hooks, 9 elements
- **ExerciseItem**: 0 hooks, 5 elements
- **GoalProgress**: 0 hooks, 5 elements
- **ProgressChart**: 0 hooks, 3 elements
- **SetLogger**: 0 hooks, 7 elements
- **StatsCard**: 0 hooks, 4 elements
- **StreakBadge**: 0 hooks, 4 elements
- **WorkoutCard**: 0 hooks, 8 elements
- **index**: 0 hooks, 0 elements

### Hooks (4)
- **useClasses**: deps [useQuery]
- **useExercises**: deps [useQuery]
- **useProgress**: deps []
- **useWorkouts**: deps [useQuery]

### Services (3)
- **classes**: getClasses(async), getClassById(async), bookClass(async), cancelBooking(async)
- **exercises**: getExercises(async), getExerciseById(async), searchExercises(async)
- **workouts**: getWorkouts(async), getWorkoutById(async)

### Navigation (expo-router)
- classes -> Classes
- index -> Index
- profile -> Profile
- progress -> Progress
- workouts -> Workouts
- [id] -> [id]
- [id] -> [id]
- log-workout -> Log-workout
- [id] -> [id]

### Types (14)
- interface FitnessClass
- interface Workout
- interface WorkoutExercise
- interface Exercise
- interface WorkoutLog
- interface ExerciseLog
- interface SetLog
- interface ProgressStats
- interface WeeklyStats
- interface Goal
- interface ClassBooking
- type ClassCategory
- type ClassDifficulty
- type WorkoutCategory