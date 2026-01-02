## Template: church

### Screens (11)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, PlayCircle, Calendar...
- **EventsScreen** (src/app/(tabs)/events.tsx)
  - Hooks: useRouter, useEvents
  - JSX: SafeAreaView, ScrollView, View, ActivityIndicator, Text...
- **GiveScreen** (src/app/(tabs)/give.tsx)
  - Hooks: useGivingFunds, useSubmitDonation
  - JSX: SafeAreaView, View, ActivityIndicator, GivingForm, Text
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useRecentSermons, useUpcomingEvents, useQuery
  - JSX: SafeAreaView, ScrollView, View, Text, AnnouncementBanner...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useRouter
  - JSX: SafeAreaView, ScrollView, View, User, Text...
- **SermonsScreen** (src/app/(tabs)/sermons.tsx)
  - Hooks: useRouter, useSeries, useState, useSermonsBySeries
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, TouchableOpacity...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **EventDetailScreen** (src/app/events/[id].tsx)
  - Hooks: useLocalSearchParams, useEvent
  - JSX: SafeAreaView, View, ActivityIndicator, Text, ScrollView...
- **GroupsScreen** (src/app/groups.tsx)
  - Hooks: useGroups
  - JSX: SafeAreaView, View, Text, TouchableOpacity, Filter...
- **PrayerScreen** (src/app/prayer.tsx)
  - Hooks: usePrayerRequests, useSubmitPrayer, usePrayFor, useState
  - JSX: SafeAreaView, View, Text, TouchableOpacity, Plus...
- **SermonDetailScreen** (src/app/sermons/[id].tsx)
  - Hooks: useLocalSearchParams, useSermon
  - JSX: SafeAreaView, View, ActivityIndicator, Text, ScrollView...

### Components (7)
- **AnnouncementBanner**: 0 hooks, 5 elements
- **EventCard**: 0 hooks, 7 elements
- **GivingForm**: 1 hooks, 5 elements
- **GroupCard**: 0 hooks, 7 elements
- **PrayerCard**: 0 hooks, 5 elements
- **SermonCard**: 0 hooks, 7 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useEvents**: deps [useQuery]
- **useGiving**: deps [useQuery, useQueryClient, useMutation]
- **useGroups**: deps [useQuery]
- **usePrayers**: deps [useQuery, useQueryClient, useMutation]
- **useSermons**: deps [useQuery]

### Services (6)
- **announcements**: getAnnouncements(async), getAnnouncementById(async)
- **events**: getEvents(async), getUpcomingEvents(async), getEventById(async), getEventsByCategory(async)
- **giving**: getGivingFunds(async), getDonationHistory(async), submitDonation(async)
- **groups**: getGroups(async), getGroupById(async), getOpenGroups(async)
- **prayers**: getPrayerRequests(async), submitPrayerRequest(async), prayForRequest(async)
- **sermons**: getSeries(async), getSermonsBySeries(async), getRecentSermons(async), getSermonById(async)

### Navigation (expo-router)
- events -> Events
- give -> Give
- index -> Index
- profile -> Profile
- sermons -> Sermons
- [id] -> [id]
- groups -> Groups
- prayer -> Prayer
- [id] -> [id]

### Types (14)
- interface Sermon
- interface Series
- interface Event
- type EventCategory
- interface Donation
- type DonationFrequency
- type PaymentMethod
- interface PrayerRequest
- type PrayerCategory
- interface Group
- type GroupCategory
- interface Announcement
- interface GivingFund
- interface User