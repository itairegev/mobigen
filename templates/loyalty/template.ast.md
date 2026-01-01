## Template: loyalty

### Screens (8)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Gift, QrCode...
- **HistoryScreen** (src/app/(tabs)/history.tsx)
  - Hooks: useTransactions
  - JSX: SafeAreaView, FlatList, TransactionItem, View, Text
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, usePoints
  - JSX: SafeAreaView, ScrollView, PointsCard, View, Text...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useRouter, usePoints
  - JSX: SafeAreaView, ScrollView, View, Text, TierBadge...
- **RewardsScreen** (src/app/(tabs)/rewards.tsx)
  - Hooks: useRewards, usePoints
  - JSX: SafeAreaView, View, Text, FlatList, RewardCard
- **ScanScreen** (src/app/(tabs)/scan.tsx)
  - JSX: SafeAreaView, View, Camera, Text, TouchableOpacity
- **SettingsScreen** (src/app/(tabs)/settings.tsx)
  - Hooks: useState
  - JSX: SafeAreaView, View, Text, Switch
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen

### Components (8)
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 2 elements
- **Input**: 0 hooks, 3 elements
- **PointsCard**: 0 hooks, 3 elements
- **RewardCard**: 1 hooks, 4 elements
- **TierBadge**: 0 hooks, 2 elements
- **TransactionItem**: 0 hooks, 2 elements
- **index**: 0 hooks, 0 elements

### Hooks (4)
- **usePoints**: deps [usePointsStore]
- **useRewards**: deps [useQuery]
- **useTheme**: deps [useColorScheme]
- **useTransactions**: deps [useQuery]

### Services (0)

### Navigation (expo-router)
- history -> History
- index -> Index
- profile -> Profile
- rewards -> Rewards
- scan -> Scan
- settings -> Settings

### Types (4)
- interface Tier
- interface Reward
- interface Transaction
- interface User