## Template: ecommerce

### Screens (7)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Grid, ShoppingCart...
- **CartScreen** (src/app/(tabs)/cart.tsx)
  - Hooks: useRouter, useCart
  - JSX: SafeAreaView, Text, Button, FlatList, CartItem...
- **CategoriesScreen** (src/app/(tabs)/categories.tsx)
  - Hooks: useRouter, useCategories
  - JSX: SafeAreaView, FlatList, TouchableOpacity, Text, View
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useState, useProducts
  - JSX: SafeAreaView, View, TextInput, FlatList, ProductCard...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useRouter
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity
- **SettingsScreen** (src/app/(tabs)/settings.tsx)
  - Hooks: useState
  - JSX: SafeAreaView, View, Text, Switch
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen

### Components (6)
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 2 elements
- **CartItem**: 0 hooks, 7 elements
- **Input**: 0 hooks, 3 elements
- **ProductCard**: 1 hooks, 5 elements
- **index**: 0 hooks, 0 elements

### Hooks (4)
- **useCart**: deps [useCartStore]
- **useCategories**: deps [useQuery]
- **useProducts**: deps [useQuery]
- **useTheme**: deps [useColorScheme]

### Services (0)

### Navigation (expo-router)
- cart -> Cart
- categories -> Categories
- index -> Index
- profile -> Profile
- settings -> Settings

### Types (6)
- interface Product
- interface Category
- interface CartItem
- interface Order
- interface Address
- interface User