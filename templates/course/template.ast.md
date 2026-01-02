## Template: course

### Screens (9)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, BookOpen, BarChart3...
- **CoursesScreen** (src/app/(tabs)/courses.tsx)
  - Hooks: useRouter, useCourses, useProgress, useState
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, TouchableOpacity...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useCourses, useProgress
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, Text...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - JSX: SafeAreaView, ScrollView, View, User, Text...
- **ProgressScreen** (src/app/(tabs)/progress.tsx)
  - Hooks: useRouter, useCourses, useProgress
  - JSX: SafeAreaView, ScrollView, Text, View, BookOpen...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, StatusBar, Stack, Stack.Screen
- **CourseDetailScreen** (src/app/courses/[id].tsx)
  - Hooks: useRouter, useLocalSearchParams, useCourse, useCourseLessons, useProgress
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, Image...
- **LessonScreen** (src/app/lessons/[id].tsx)
  - Hooks: useRouter, useLocalSearchParams, useLesson, useProgress, useState
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, VideoPlayer...
- **QuizScreen** (src/app/quiz/[id].tsx)
  - Hooks: useRouter, useLocalSearchParams, useLesson, useQuiz, useProgress
  - JSX: SafeAreaView, View, ActivityIndicator, Award, XCircle...

### Components (8)
- **Certificate**: 0 hooks, 3 elements
- **CourseCard**: 0 hooks, 6 elements
- **LessonItem**: 0 hooks, 7 elements
- **NotesEditor**: 1 hooks, 7 elements
- **ProgressBar**: 0 hooks, 2 elements
- **QuizQuestion**: 0 hooks, 3 elements
- **VideoPlayer**: 2 hooks, 3 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useCourses**: deps [useQuery]
- **useLessons**: deps [useQuery]
- **useProgress**: deps []
- **useQuiz**: deps [useState, useQuery]
- **useTheme**: deps [useColorScheme]

### Services (1)
- **courses**: getCourses(async), getCourse(async), getCourseLessons(async), getLesson(async), getQuiz(async)

### Navigation (expo-router)
- courses -> Courses
- index -> Index
- profile -> Profile
- progress -> Progress
- [id] -> [id]
- [id] -> [id]
- [id] -> [id]

### Types (12)
- interface Course
- interface Lesson
- interface LessonResource
- interface Quiz
- interface Question
- interface QuizAttempt
- interface Answer
- interface Enrollment
- interface CourseProgress
- interface Certificate
- interface LessonNote
- interface ProgressStats