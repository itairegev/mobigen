import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Heart, MessageCircle, Flame, Sparkles, Lightbulb } from 'lucide-react-native';
import { Post, ReactionType } from '../types';
import { formatRelativeTime } from '../utils';
import { TierBadge } from './TierBadge';
import { useRouter } from 'expo-router';

interface PostCardProps {
  post: Post;
  onReaction?: (type: ReactionType) => void;
  testID?: string;
}

export function PostCard({ post, onReaction, testID }: PostCardProps) {
  const router = useRouter();

  const reactionIcons: Record<ReactionType, any> = {
    like: Heart,
    heart: Heart,
    fire: Flame,
    celebrate: Sparkles,
    insightful: Lightbulb,
  };

  const reactionCounts = post.reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<ReactionType, number>);

  return (
    <TouchableOpacity
      testID={testID}
      className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4"
      onPress={() => router.push(`/posts/${post.id}`)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: post.author.avatar }}
          className="w-10 h-10 rounded-full"
        />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-semibold text-gray-900 dark:text-white">
              {post.author.name}
            </Text>
            <TierBadge tier={post.author.tier} size="sm" />
          </View>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
        {post.pinned && (
          <View className="bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded">
            <Text className="text-xs font-medium text-primary-600 dark:text-primary-400">
              Pinned
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text className="text-gray-900 dark:text-white mb-3 leading-5">
        {post.content}
      </Text>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3 -mx-4"
        >
          <View className="flex-row px-4 gap-2">
            {post.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                className="w-64 h-48 rounded-lg"
                resizeMode="cover"
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Reactions Bar */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
        <View className="flex-row items-center gap-4">
          {Object.entries(reactionCounts).map(([type, count]) => {
            const Icon = reactionIcons[type as ReactionType];
            return (
              <TouchableOpacity
                key={type}
                testID={`reaction-${type}`}
                className="flex-row items-center gap-1"
                onPress={() => onReaction?.(type as ReactionType)}
              >
                <Icon size={18} color="#ec4899" />
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
          {Object.keys(reactionCounts).length === 0 && (
            <TouchableOpacity
              testID="reaction-like"
              className="flex-row items-center gap-1"
              onPress={() => onReaction?.('like')}
            >
              <Heart size={18} color="#94a3b8" />
              <Text className="text-sm text-gray-400">React</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          testID="comments-button"
          className="flex-row items-center gap-1"
          onPress={() => router.push(`/posts/${post.id}`)}
        >
          <MessageCircle size={18} color="#64748b" />
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {post.commentCount}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
