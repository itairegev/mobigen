import { View, Text, Image, FlatList } from 'react-native';
import { Comment } from '../types';
import { formatRelativeTime } from '../utils';
import { TierBadge } from './TierBadge';

interface CommentThreadProps {
  comments: Comment[];
  testID?: string;
}

export function CommentThread({ comments, testID }: CommentThreadProps) {
  const renderComment = ({ item: comment }: { item: Comment }) => (
    <View className="py-3 border-b border-gray-100 dark:border-slate-700">
      <View className="flex-row">
        <Image
          source={{ uri: comment.author.avatar }}
          className="w-8 h-8 rounded-full"
        />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="font-medium text-gray-900 dark:text-white text-sm">
              {comment.author.name}
            </Text>
            <TierBadge tier={comment.author.tier} size="sm" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(comment.createdAt)}
            </Text>
          </View>
          <Text className="text-gray-800 dark:text-gray-200 leading-5">
            {comment.content}
          </Text>
          {comment.reactions.length > 0 && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comment.reactions.length} {comment.reactions.length === 1 ? 'like' : 'likes'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View testID={testID} className="px-4">
      {comments.length === 0 ? (
        <View className="py-8">
          <Text className="text-center text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}
