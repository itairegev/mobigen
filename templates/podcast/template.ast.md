## Template: podcast

### Screens (9)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - Hooks: useRouter, usePlayer
  - JSX: View, Tabs, Tabs.Screen, Home, Mic...
- **CommunityScreen** (src/app/(tabs)/community.tsx)
  - JSX: ScrollView, View, Text, Image, TouchableOpacity...
- **EpisodesScreen** (src/app/(tabs)/episodes.tsx)
  - Hooks: useRouter, useState, useEpisodes, useSearchEpisodes, usePlayer
  - JSX: View, Search, TextInput, ActivityIndicator, FlatList...
- **ExclusivesScreen** (src/app/(tabs)/exclusives.tsx)
  - Hooks: useRouter, useExclusiveEpisodes, usePlayer
  - JSX: View, Crown, Text, ActivityIndicator, Lock...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useFeaturedEpisodes, usePlayer
  - JSX: View, ActivityIndicator, ScrollView, Image, Text...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useState, usePlayer
  - JSX: ScrollView, View, User, Text, TouchableOpacity...
- **RootContent** (src/app/_layout.tsx)
  - Hooks: useDownloads, useEffect
  - JSX: QueryClientProvider, RootContent, Stack, Stack.Screen
- **EpisodeDetailScreen** (src/app/episodes/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useEpisode, usePlayer, useState
  - JSX: View, ActivityIndicator, Text, ScrollView, Image...
- **PlayerScreen** (src/app/player.tsx)
  - Hooks: useRouter, usePlayer, useState
  - JSX: View, TouchableOpacity, ChevronDown, Text, MoreVertical...

### Components (8)
- **AudioPlayer**: 0 hooks, 10 elements
- **EpisodeCard**: 0 hooks, 6 elements
- **MiniPlayer**: 0 hooks, 6 elements
- **PlaybackControls**: 0 hooks, 7 elements
- **PlaybackSpeed**: 0 hooks, 4 elements
- **ProgressSlider**: 0 hooks, 2 elements
- **ShowNotes**: 0 hooks, 2 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useDownloads**: deps []
- **useEpisodes**: deps [useQuery]
- **usePlayback**: deps [usePlayer, useRef, useEffect]
- **usePlayer**: deps []
- **useTheme**: deps [useColorScheme]

### Services (2)
- **api**: request(async)
- **episodes**: getAllEpisodes(async), getEpisodeById(async), getEpisodesBySeries(async), getAllSeries(async), searchEpisodes(async), getFeaturedEpisodes(async), getExclusiveEpisodes(async)

### Navigation (expo-router)
- community -> Community
- episodes -> Episodes
- exclusives -> Exclusives
- index -> Index
- profile -> Profile
- [id] -> [id]
- player -> Player

### Types (8)
- interface Episode
- interface Series
- interface PlayState
- interface PlaybackSettings
- interface Comment
- interface Download
- interface User
- interface PlayerUIState