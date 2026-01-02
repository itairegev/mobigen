import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { formatRelativeTime } from '../../utils';
import { usePost, useComments, useToggleReaction } from '../../hooks';
import { TierBadge, ReactionBar, CommentThread } from '../../components';
import { ReactionType } from '../../types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading } = usePost(id);
  const { data: comments } = useComments(id);
  const toggleReaction = useToggleReaction();

  const handleReaction = (type: ReactionType) => {
    if (post) {
      toggleReaction.mutate({ postId: post.id, type, userId: '1' });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <Text className="text-gray-500 dark:text-gray-400">Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900">
      {/* Post Header */}
      <View className="p-4 border-b border-gray-200 dark:border-slate-700">
        <View className="flex-row items-center mb-3">
          <Image
            source={{ uri: post.author.avatar }}
            className="w-12 h-12 rounded-full"
          />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-semibold text-gray-900 dark:text-white text-base">
                {post.author.name}
              </Text>
              <TierBadge tier={post.author.tier} size="sm" />
            </View>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              {formatRelativeTime(post.createdAt)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Text className="text-gray-900 dark:text-white text-base leading-6 mb-3">
          {post.content}
        </Text>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <View className="mb-4">
            {post.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                className="w-full h-64 rounded-lg mb-2"
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {/* Reaction Stats */}
        <View className="flex-row items-center gap-4 mb-3">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {post.reactions.length} reactions
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {post.commentCount} comments
          </Text>
        </View>

        {/* Reaction Bar */}
        <ReactionBar
          onReaction={handleReaction}
          selectedReactions={post.reactions
            .filter((r) => r.userId === '1')
            .map((r) => r.type)}
        />
      </View>

      {/* Comments Section */}
      <View className="py-4">
        <Text className="px-4 text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Comments ({comments?.length || 0})
        </Text>
        <CommentThread comments={comments || []} testID="comment-thread" />
      </View>
    </ScrollView>
  );
}
