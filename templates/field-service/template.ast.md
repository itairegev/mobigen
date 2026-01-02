## Template: field-service

### Screens (10)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Briefcase, Clock...
- **QuickActionCard** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useJobs, useState, useEffect
  - JSX: SafeAreaView, ScrollView, RefreshControl, View, Text...
- **JobsScreen** (src/app/(tabs)/jobs.tsx)
  - Hooks: useRouter, useJobs, useState, useEffect
  - JSX: SafeAreaView, ScrollView, TouchableOpacity, Text, RefreshControl...
- **ConversationCard** (src/app/(tabs)/messages.tsx)
  - Hooks: useClients
  - JSX: SafeAreaView, ScrollView, RefreshControl, View, ConversationCard...
- **MenuItem** (src/app/(tabs)/profile.tsx)
  - JSX: SafeAreaView, ScrollView, View, Text, MenuItem...
- **TimeEntryCard** (src/app/(tabs)/timelog.tsx)
  - Hooks: useTimeLog, useEffect
  - JSX: SafeAreaView, ScrollView, RefreshControl, View, Text...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: StatusBar, Stack, Stack.Screen
- **JobPhotosScreen** (src/app/jobs/[id]/photos.tsx)
  - Hooks: useRouter, useLocalSearchParams, useJobs, usePhotos
  - JSX: SafeAreaView, View, TouchableOpacity, ArrowLeft, Text...
- **UpdateStatusScreen** (src/app/jobs/[id]/status.tsx)
  - Hooks: useRouter, useLocalSearchParams, useJobs, useState
  - JSX: SafeAreaView, View, TouchableOpacity, ArrowLeft, Text...
- **JobDetailScreen** (src/app/jobs/[id].tsx)
  - Hooks: useRouter, useLocalSearchParams, useJobs, useTimeLog, useState, useEffect
  - JSX: SafeAreaView, View, Text, TouchableOpacity, ArrowLeft...

### Components (8)
- **ClientCard**: 0 hooks, 6 elements
- **JobCard**: 0 hooks, 6 elements
- **StatCard**: 0 hooks, 7 elements
- **MapView**: 0 hooks, 5 elements
- **PhotoCapture**: 0 hooks, 8 elements
- **StatusSelector**: 0 hooks, 6 elements
- **TimeTracker**: 2 hooks, 7 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useClients**: deps [useState, useEffect]
- **useJobs**: deps []
- **usePhotos**: deps [useState]
- **useTheme**: deps []
- **useTimeLog**: deps []

### Services (1)
- **jobs**: getJobs(async), getJobById(async), updateJobStatus(async), getTimeEntries(async), clockIn(async), clockOut(async), getConversations(async), getJobStats(async)

### Navigation (expo-router)
- index -> Index
- jobs -> Jobs
- messages -> Messages
- profile -> Profile
- timelog -> Timelog
- photos -> Photos
- status -> Status
- [id] -> [id]

### Types (11)
- type JobStatus
- type JobPriority
- interface Job
- interface Client
- interface Location
- interface TimeEntry
- interface Photo
- interface Message
- interface Conversation
- interface JobStats
- interface DailySchedule