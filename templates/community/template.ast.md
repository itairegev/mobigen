## Template: community

### Screens (11)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Calendar, Users...
- **EventsScreen** (src/app/(tabs)/events.tsx)
  - Hooks: useUpcomingEvents
  - JSX: View, Text, TouchableOpacity, Video, MapPin...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, usePosts, useToggleReaction
  - JSX: View, Text, FlatList, PostCard, RefreshControl...
- **MembersScreen** (src/app/(tabs)/members.tsx)
  - Hooks: useState, useMembers, useSearchMembers
  - JSX: View, Text, Search, TextInput, FlatList...
- **MessagesScreen** (src/app/(tabs)/messages.tsx)
  - JSX: View, Text, FlatList, TouchableOpacity, Image...
- **MenuItem** (src/app/(tabs)/profile.tsx)
  - JSX: ScrollView, View, Image, Text, TierBadge...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, StatusBar, Stack, Stack.Screen
- **EventDetailScreen** (src/app/events/[id].tsx)
  - Hooks: useLocalSearchParams, useEvent, useUpdateRSVP
  - JSX: View, ActivityIndicator, Text, ScrollView, Image...
- **ConversationScreen** (src/app/messages/[id].tsx)
  - Hooks: useState
  - JSX: KeyboardAvoidingView, FlatList, View, Text, TextInput...
- **PostDetailScreen** (src/app/posts/[id].tsx)
  - Hooks: useLocalSearchParams, usePost, useComments, useToggleReaction
  - JSX: View, ActivityIndicator, Text, ScrollView, Image...
- **CreatePostScreen** (src/app/posts/create.tsx)
  - Hooks: useRouter, useCreatePost
  - JSX: View, CreatePostForm

### Components (8)
- **CommentThread**: 0 hooks, 5 elements
- **CreatePostForm**: 1 hooks, 7 elements
- **EventCard**: 1 hooks, 9 elements
- **MemberCard**: 0 hooks, 7 elements
- **PostCard**: 1 hooks, 9 elements
- **ReactionBar**: 0 hooks, 4 elements
- **TierBadge**: 0 hooks, 3 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useEvents**: deps [useQuery, useQueryClient, useMutation]
- **useMembers**: deps [useQuery]
- **useMessages**: deps []
- **usePosts**: deps [useQuery, useQueryClient, useMutation]
- **useTheme**: deps [useColorScheme]

### Services (3)
- **events**: getEvents(async), getEvent(async), getUpcomingEvents(async), updateRSVP(async), getMyEvents(async)
- **members**: getMembers(async), getMember(async), searchMembers(async), getMembersByTier(async)
- **posts**: getPosts(async), getPost(async), getComments(async), createPost(async), toggleReaction(async)

### Navigation (expo-router)
- events -> Events
- index -> Index
- members -> Members
- messages -> Messages
- profile -> Profile
- [id] -> [id]
- [id] -> [id]
- [id] -> [id]
- create -> Create

### Types (14)
- interface Member
- type MembershipTier
- interface Membership
- interface Post
- interface Comment
- type ReactionType
- interface Reaction
- interface Event
- type RSVPStatus
- interface RSVP
- interface Conversation
- interface Message
- interface MessageAttachment
- interface TierBenefit