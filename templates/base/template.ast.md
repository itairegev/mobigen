## Template: base

### Screens (4)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Settings
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - JSX: SafeAreaView, View, Text, Button
- **SettingsScreen** (src/app/(tabs)/settings.tsx)
  - Hooks: useState
  - JSX: SafeAreaView, View, Text, Switch
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen

### Components (5)
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 2 elements
- **Input**: 0 hooks, 3 elements
- **SilentUpdateHandler**: 1 hooks, 4 elements
- **index**: 0 hooks, 0 elements

### Hooks (2)
- **useTheme**: deps [useColorScheme]
- **useUpdates**: deps [useState, useCallback, useEffect]

### Services (1)
- **updates**: isUpdatesEnabled(), getCurrentUpdate(), checkForUpdates(async), fetchUpdate(async), reloadApp(async), checkAndDownloadUpdate(async), trackUpdateEvent(async), initializeUpdates(async)

### Navigation (expo-router)
- index -> Index
- settings -> Settings

### Types (0)