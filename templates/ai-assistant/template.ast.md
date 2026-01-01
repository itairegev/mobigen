## Template: ai-assistant

### Screens (5)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, MessageSquare, History, Settings
- **HistoryScreen** (src/app/(tabs)/history.tsx)
  - Hooks: useRouter, useChat
  - JSX: SafeAreaView, View, Pressable, Plus, Text...
- **ChatScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRef, useChat, useSuggestions, useEffect
  - JSX: SafeAreaView, KeyboardAvoidingView, ScrollView, View, Text...
- **SettingsScreen** (src/app/(tabs)/settings.tsx)
  - Hooks: useSettings
  - JSX: Pressable, View, Text, ChevronRight, SafeAreaView...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen

### Components (9)
- **Button**: 0 hooks, 3 elements
- **Card**: 0 hooks, 2 elements
- **ChatBubble**: 0 hooks, 2 elements
- **ChatInput**: 2 hooks, 5 elements
- **ConversationItem**: 0 hooks, 5 elements
- **Input**: 0 hooks, 3 elements
- **SuggestionCard**: 0 hooks, 2 elements
- **TypingIndicator**: 3 hooks, 3 elements
- **index**: 0 hooks, 0 elements

### Hooks (4)
- **useChat**: deps [useChatStore]
- **useSettings**: deps [useSettingsStore]
- **useSuggestions**: deps []
- **useTheme**: deps [useColorScheme]

### Services (0)

### Navigation (expo-router)
- history -> History
- index -> Index
- settings -> Settings

### Types (7)
- type MessageRole
- type MessageStatus
- interface Message
- interface Conversation
- interface AIModel
- interface UserSettings
- interface SuggestedPrompt