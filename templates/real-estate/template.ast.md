## Template: real-estate

### Screens (10)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Search, Heart...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useFeaturedProperties
  - JSX: ScrollView, View, Text, TouchableOpacity, Calculator...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useRouter, useSaved, useTours
  - JSX: ScrollView, View, Card, User, Text...
- **SavedScreen** (src/app/(tabs)/saved.tsx)
  - Hooks: useSaved, useProperties
  - JSX: ScrollView, View, Text, ActivityIndicator, PropertyCard...
- **SearchScreen** (src/app/(tabs)/search.tsx)
  - Hooks: useState, useSearch, useSearchProperties
  - JSX: View, Input, TouchableOpacity, Filter, Text...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **CalculatorScreen** (src/app/calculator.tsx)
  - JSX: ScrollView, View, Text, MortgageCalc
- **ContactScreen** (src/app/contact.tsx)
  - Hooks: useState
  - JSX: ScrollView, View, Text, Card, Input...
- **PropertyDetailScreen** (src/app/properties/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useProperty, useSaved, useQuery
  - JSX: View, ActivityIndicator, Text, ScrollView, ImageGallery...
- **ScheduleTourScreen** (src/app/schedule-tour.tsx)
  - Hooks: useLocalSearchParams
  - JSX: ScrollView, View, Text, TourScheduler

### Components (12)
- **AgentCard**: 0 hooks, 8 elements
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 1 elements
- **FilterPanel**: 0 hooks, 7 elements
- **ImageGallery**: 1 hooks, 6 elements
- **Input**: 0 hooks, 3 elements
- **MapView**: 0 hooks, 6 elements
- **MortgageCalc**: 1 hooks, 4 elements
- **PropertyCard**: 2 hooks, 8 elements
- **PropertyDetails**: 0 hooks, 9 elements
- **TourScheduler**: 3 hooks, 8 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useProperties**: deps [useQuery]
- **useSaved**: deps []
- **useSearch**: deps []
- **useTheme**: deps [useColorScheme]
- **useTours**: deps []

### Services (1)
- **properties**: getProperties(async), getPropertyById(async), getAgentById(async), searchProperties(async), getFeaturedProperties(async)

### Navigation (expo-router)
- index -> Index
- profile -> Profile
- saved -> Saved
- search -> Search
- calculator -> Calculator
- contact -> Contact
- [id] -> [id]
- schedule-tour -> Schedule-tour

### Types (9)
- type PropertyType
- type PropertyStatus
- interface Property
- interface Agent
- interface Tour
- interface SearchFilters
- interface MortgageParams
- interface MortgageResult
- interface SavedProperty