## Template: marketplace

### Screens (11)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - Hooks: useConversations
  - JSX: View, Text, Tabs, Tabs.Screen, Home...
- **CategoriesScreen** (src/app/(tabs)/categories.tsx)
  - Hooks: useLocalSearchParams, useCategories, useState, useListings, useEffect
  - JSX: SafeAreaView, View, FlatList, TouchableOpacity, Text...
- **FavoritesScreen** (src/app/(tabs)/favorites.tsx)
  - Hooks: useFavorites, useListings
  - JSX: SafeAreaView, FlatList, View, ListingCard, Text
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useState, useListings, useCategories
  - JSX: SafeAreaView, View, Search, TextInput, TouchableOpacity...
- **MessagesScreen** (src/app/(tabs)/messages.tsx)
  - Hooks: useRouter, useConversations
  - JSX: SafeAreaView, FlatList, TouchableOpacity, Image, View...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useRouter, useFavorites, useConversations
  - JSX: SafeAreaView, ScrollView, View, Image, Text...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **ListingDetailScreen** (src/app/listings/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useListing, useFavorites, useCreateConversation, useState
  - JSX: SafeAreaView, Text, ScrollView, View, Image...
- **CreateListingScreen** (src/app/listings/create.tsx)
  - Hooks: useRouter, useCategories, useCreateListing, useState
  - JSX: SafeAreaView, ScrollView, Text, ImageUploader, Input...
- **ConversationScreen** (src/app/messages/[id].tsx)
  - Hooks: useLocalSearchParams, useConversation, useMessages, useSendMessage, useState
  - JSX: SafeAreaView, Text, KeyboardAvoidingView, View, FlatList...
- **MyListingsScreen** (src/app/my-listings.tsx)
  - Hooks: useListings
  - JSX: SafeAreaView, FlatList, View, ListingCard, Text

### Components (11)
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 2 elements
- **CategoryGrid**: 1 hooks, 5 elements
- **ChatBubble**: 0 hooks, 2 elements
- **ConditionBadge**: 0 hooks, 2 elements
- **ImageUploader**: 0 hooks, 7 elements
- **Input**: 0 hooks, 3 elements
- **ListingCard**: 2 hooks, 7 elements
- **PriceInput**: 0 hooks, 4 elements
- **SellerCard**: 0 hooks, 4 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useCategories**: deps [useQuery]
- **useConversations**: deps [useQuery, useQueryClient, useMutation]
- **useFavorites**: deps []
- **useListings**: deps [useQuery, useQueryClient, useMutation]
- **useTheme**: deps [useColorScheme]

### Services (3)
- **categories**: fetchCategories(async), fetchCategory(async)
- **listings**: fetchListings(async), fetchListing(async), searchListings(async), createListing(async)
- **messages**: fetchConversations(async), fetchConversation(async), fetchMessages(async), sendMessage(async), createConversation(async)

### Navigation (expo-router)
- categories -> Categories
- favorites -> Favorites
- index -> Index
- messages -> Messages
- profile -> Profile
- [id] -> [id]
- create -> Create
- [id] -> [id]
- my-listings -> My-listings

### Types (7)
- type ListingCondition
- interface Listing
- interface Category
- interface Seller
- interface Conversation
- interface Message
- interface User