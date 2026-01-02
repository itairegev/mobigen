## Template: event

### Screens (12)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Calendar, Users...
- **AttendeesScreen** (src/app/(tabs)/attendees.tsx)
  - Hooks: useAttendees, useState
  - JSX: SafeAreaView, View, Search, TextInput, Text...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useSessions, useSpeakers
  - JSX: SafeAreaView, ScrollView, View, Text, Calendar...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useRouter, useAgenda
  - JSX: SafeAreaView, ScrollView, View, Image, Text...
- **ScheduleScreen** (src/app/(tabs)/schedule.tsx)
  - Hooks: useRouter, useSessions, useTracks, useState
  - JSX: SafeAreaView, View, TrackFilter, FlatList, Text...
- **SpeakersScreen** (src/app/(tabs)/speakers.tsx)
  - Hooks: useRouter, useSpeakers, useState
  - JSX: SafeAreaView, View, Search, TextInput, FlatList...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **AgendaScreen** (src/app/agenda.tsx)
  - Hooks: useRouter, useAgenda, useSessions
  - JSX: SafeAreaView, View, Calendar, Text, FlatList...
- **MapScreen** (src/app/map.tsx)
  - JSX: SafeAreaView, VenueMap
- **SessionDetailScreen** (src/app/sessions/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useSession, useAgenda, useSpeaker
  - JSX: SafeAreaView, ActivityIndicator, Text, ScrollView, View...
- **SpeakerDetailScreen** (src/app/speakers/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useSpeaker, useSessions
  - JSX: SafeAreaView, ActivityIndicator, Text, ScrollView, View...
- **SponsorsScreen** (src/app/sponsors.tsx)
  - Hooks: useQuery
  - JSX: SafeAreaView, FlatList, View, Text, SponsorTile

### Components (10)
- **AgendaItem**: 1 hooks, 8 elements
- **AttendeeCard**: 0 hooks, 5 elements
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 1 elements
- **SessionCard**: 1 hooks, 6 elements
- **SpeakerCard**: 0 hooks, 5 elements
- **SponsorTile**: 0 hooks, 4 elements
- **TrackFilter**: 0 hooks, 3 elements
- **VenueMap**: 0 hooks, 3 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useAgenda**: deps []
- **useAttendees**: deps [useQuery]
- **useSessions**: deps [useQuery]
- **useSpeakers**: deps [useQuery]
- **useTheme**: deps [useColorScheme]

### Services (4)
- **attendees**: fetchAttendees(async), fetchAttendeeById(async)
- **sessions**: fetchSessions(async), fetchSessionById(async), fetchSessionsByTrack(async), fetchTracks(async)
- **speakers**: fetchSpeakers(async), fetchSpeakerById(async)
- **sponsors**: fetchSponsors(async), fetchSponsorsByTier(async)

### Navigation (expo-router)
- attendees -> Attendees
- index -> Index
- profile -> Profile
- schedule -> Schedule
- speakers -> Speakers
- agenda -> Agenda
- map -> Map
- [id] -> [id]
- [id] -> [id]
- sponsors -> Sponsors

### Types (8)
- interface Session
- interface Speaker
- interface Attendee
- interface Sponsor
- interface Track
- interface Venue
- interface AgendaItem
- interface Event