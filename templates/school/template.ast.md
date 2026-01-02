## Template: school

### Screens (11)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, BookOpen, Award...
- **CalendarScreen** (src/app/(tabs)/calendar.tsx)
  - Hooks: useState, useCalendarEvents, useEventsByDate
  - JSX: View, ScrollView, RefreshControl, CalendarView, Text...
- **GradesScreen** (src/app/(tabs)/grades.tsx)
  - Hooks: useRouter, useGPA, useSubjectGradesSummary
  - JSX: View, ScrollView, RefreshControl, Award, Text...
- **HomeworkScreen** (src/app/(tabs)/homework.tsx)
  - Hooks: useRouter, useState, useAssignments
  - JSX: View, ScrollView, Pressable, Text, RefreshControl...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useUpcomingAssignments, useUnreadAnnouncements, useGPA, useSubjectGradesSummary, useUpcomingEvents
  - JSX: ScrollView, RefreshControl, View, Text, TrendingUp...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useSubjects, useGPA
  - JSX: ScrollView, View, Text, TrendingUp, Calendar...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **AnnouncementsScreen** (src/app/announcements.tsx)
  - Hooks: useRouter, useState, useAnnouncements
  - JSX: View, ScrollView, Pressable, Text, RefreshControl...
- **AssignmentDetailScreen** (src/app/homework/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useAssignment
  - JSX: View, Text, Pressable, AlertCircle, CheckCircle2...
- **MessagesScreen** (src/app/messages.tsx)
  - JSX: View, ScrollView, Pressable, Text, Mail
- **ResourcesScreen** (src/app/resources.tsx)
  - JSX: FileText, Video, LinkIcon, ImageIcon, ScrollView...

### Components (5)
- **AnnouncementCard**: 0 hooks, 6 elements
- **AssignmentCard**: 0 hooks, 8 elements
- **CalendarView**: 1 hooks, 5 elements
- **SubjectGradeSummaryCard**: 0 hooks, 6 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useAnnouncements**: deps [useQuery]
- **useAssignments**: deps [useQuery]
- **useCalendar**: deps [useQuery]
- **useGrades**: deps [useQuery]
- **useSubjects**: deps [useQuery]

### Services (5)
- **announcements**: getAnnouncements(async), getAnnouncementById(async), getUnreadAnnouncements(async), markAnnouncementRead(async)
- **assignments**: getAssignments(async), getAssignmentById(async), getUpcomingAssignments(async), getAssignmentsBySubject(async), submitAssignment(async)
- **calendar**: getDateOffset(), getCalendarEvents(async), getEventsByDate(async), getUpcomingEvents(async), getEventsByType(async)
- **grades**: getGrades(async), getGradesBySubject(async), getSubjectGradesSummary(async), calculateGPA(async), percentageToLetterGrade(), letterGradeToGPA()
- **subjects**: getSubjects(async), getSubjectById(async)

### Navigation (expo-router)
- calendar -> Calendar
- grades -> Grades
- homework -> Homework
- index -> Index
- profile -> Profile
- announcements -> Announcements
- [id] -> [id]
- messages -> Messages
- resources -> Resources

### Types (21)
- interface Assignment
- type AssignmentStatus
- type AssignmentType
- interface Announcement
- type AnnouncementCategory
- interface Grade
- type LetterGrade
- type GradeCategory
- interface Subject
- interface CalendarEvent
- type EventType
- interface Resource
- type ResourceType
- interface Message
- interface MessageThread
- interface Participant
- interface Attachment
- interface StudentProfile
- interface AttendanceStats
- interface AcademicStats
- interface SubjectGradesSummary