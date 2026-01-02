## Template: sports-team

### Screens (10)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Calendar, Users...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useNextGame, useRecentGames, useLatestNews, useStandings
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **NewsScreen** (src/app/(tabs)/news.tsx)
  - Hooks: useState, useNews
  - JSX: SafeAreaView, View, ScrollView, TouchableOpacity, Text...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useState
  - JSX: SafeAreaView, ScrollView, View, User, Text...
- **RosterScreen** (src/app/(tabs)/roster.tsx)
  - Hooks: useState, usePlayers
  - JSX: SafeAreaView, View, ScrollView, TouchableOpacity, Text...
- **ScheduleScreen** (src/app/(tabs)/schedule.tsx)
  - Hooks: useState, useGames
  - JSX: SafeAreaView, View, TouchableOpacity, Text, ScrollView...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **StatRow** (src/app/games/[id].tsx)
  - Hooks: useLocalSearchParams, useGame
  - JSX: SafeAreaView, View, ActivityIndicator, Text, ScrollView...
- **PlayerProfileScreen** (src/app/players/[id].tsx)
  - Hooks: useLocalSearchParams, usePlayer
  - JSX: SafeAreaView, View, ActivityIndicator, Text, ScrollView...
- **ProductCard** (src/app/shop.tsx)
  - Hooks: useProducts
  - JSX: SafeAreaView, ScrollView, View, Text, ActivityIndicator...

### Components (7)
- **GameCard**: 0 hooks, 5 elements
- **NewsItem**: 0 hooks, 5 elements
- **PlayerCard**: 0 hooks, 4 elements
- **ScoreBoard**: 0 hooks, 3 elements
- **StandingsTable**: 0 hooks, 4 elements
- **StatsGrid**: 0 hooks, 2 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useGames**: deps [useQuery]
- **useNews**: deps [useQuery]
- **usePlayers**: deps [useQuery]
- **useShop**: deps [useQuery]
- **useStandings**: deps [useQuery]

### Services (6)
- **games**: getGames(async), getGame(async), getUpcomingGames(async), getRecentGames(async), getNextGame(async)
- **news**: getNews(async), getNewsArticle(async), getNewsByCategory(async), getLatestNews(async)
- **players**: getPlayers(async), getPlayer(async), getPlayersByPosition(async), getTopScorers(async)
- **shop**: getProducts(async), getProduct(async), getFeaturedProducts(async), getProductsByCategory(async)
- **standings**: getStandings(async), getTeamStanding(async)
- **teams**: getTeam(async), getAllTeams(async)

### Navigation (expo-router)
- index -> Index
- news -> News
- profile -> Profile
- roster -> Roster
- schedule -> Schedule
- [id] -> [id]
- [id] -> [id]
- shop -> Shop

### Types (13)
- type GameStatus
- type GameLocation
- type PlayerPosition
- interface Team
- interface Score
- interface Game
- interface GameStats
- interface Player
- interface PlayerStats
- interface NewsArticle
- interface Standing
- interface Product
- interface User