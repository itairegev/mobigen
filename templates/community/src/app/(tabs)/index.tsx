import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { usePosts, useToggleReaction } from '../../hooks';
import { PostCard } from '../../components';
import { ReactionType } from '../../types';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const { data: posts, isLoading, refetch } = usePosts();
  const toggleReaction = useToggleReaction();

  const handleReaction = (postId: string, type: ReactionType) => {
    toggleReaction.mutate({ postId, type, userId: '1' }); // Mock user ID
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      {/* Header Banner */}
      <View className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4">
        <Text className="text-white text-xl font-bold">Community Feed</Text>
        <Text className="text-white/80 text-sm">
          See what's happening in your community
        </Text>
      </View>

      <FlatList
        testID="posts-list"
        data={posts || []}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onReaction={(type) => handleReaction(item.id, type)}
            testID={`post-${item.id}`}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="py-12 px-4">
            <Text className="text-center text-gray-500 dark:text-gray-400">
              No posts yet. Be the first to share something!
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        testID="create-post-fab"
        className="absolute bottom-6 right-6 bg-primary-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/posts/create')}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
