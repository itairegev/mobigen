## Template: news

### Screens (7)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Compass, Bookmark...
- **BookmarksScreen** (src/app/(tabs)/bookmarks.tsx)
  - Hooks: useBookmarks, useArticles
  - JSX: SafeAreaView, ActivityIndicator, ScrollView, View, Bookmark...
- **DiscoverScreen** (src/app/(tabs)/discover.tsx)
  - Hooks: useState, useCategories, useArticles
  - JSX: SafeAreaView, View, ScrollView, CategoryPill, ActivityIndicator...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useState, useArticles, useFeaturedArticles, useCallback
  - JSX: SafeAreaView, ActivityIndicator, ScrollView, RefreshControl, View...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useState
  - JSX: Pressable, View, Text, ChevronRight, SafeAreaView...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **ArticleDetailScreen** (src/app/article/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useArticle
  - JSX: SafeAreaView, ActivityIndicator, Text, Stack.Screen, Pressable...

### Components (8)
- **ArticleCard**: 1 hooks, 5 elements
- **BookmarkButton**: 1 hooks, 2 elements
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 2 elements
- **CategoryPill**: 0 hooks, 2 elements
- **FeaturedArticle**: 1 hooks, 5 elements
- **Input**: 0 hooks, 3 elements
- **index**: 0 hooks, 0 elements

### Hooks (4)
- **useArticles**: deps [useQuery]
- **useBookmarks**: deps [useBookmarksStore]
- **useCategories**: deps [useQuery]
- **useTheme**: deps [useColorScheme]

### Services (0)

### Navigation (expo-router)
- bookmarks -> Bookmarks
- discover -> Discover
- index -> Index
- profile -> Profile
- [id] -> [id]

### Types (5)
- interface Category
- interface Author
- interface Article
- interface Bookmark
- interface UserPreferences