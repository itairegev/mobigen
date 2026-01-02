import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ReactNode } from 'react';

export interface Post {
  id: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: Date;
  content: string;
  images?: string[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onAuthorPress?: (authorName: string) => void;
  onImagePress?: (images: string[], index: number) => void;
  actions?: ReactNode;
  testID?: string;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onAuthorPress,
  onImagePress,
  actions,
  testID,
}: PostCardProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View className="bg-white mb-2 border-b border-gray-200" testID={testID}>
      {/* Header */}
      <View className="flex-row items-center p-4">
        <TouchableOpacity
          onPress={() => onAuthorPress?.(post.authorName)}
          className="flex-row items-center flex-1"
        >
          {post.authorAvatar ? (
            <Image
              source={{ uri: post.authorAvatar }}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center mr-3">
              <Text className="text-gray-600 font-semibold">
                {post.authorName.charAt(0)}
              </Text>
            </View>
          )}

          <View className="flex-1">
            <Text className="font-semibold text-gray-900">
              {post.authorName}
            </Text>
            <Text className="text-sm text-gray-500">
              {formatTimestamp(post.timestamp)}
            </Text>
          </View>
        </TouchableOpacity>

        {actions && <View className="ml-2">{actions}</View>}
      </View>

      {/* Content */}
      <View className="px-4 pb-3">
        <Text className="text-gray-900 text-base">{post.content}</Text>
      </View>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <View className="mb-3">
          {post.images.length === 1 ? (
            <TouchableOpacity
              onPress={() => onImagePress?.(post.images!, 0)}
            >
              <Image
                source={{ uri: post.images[0] }}
                className="w-full aspect-video"
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View className="flex-row flex-wrap">
              {post.images.slice(0, 4).map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => onImagePress?.(post.images!, index)}
                  className={`${
                    post.images!.length === 2 ? 'w-1/2' : 'w-1/2'
                  } aspect-square p-0.5`}
                >
                  <Image
                    source={{ uri: image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  {index === 3 && post.images!.length > 4 && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <Text className="text-white text-2xl font-semibold">
                        +{post.images!.length - 4}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-around px-4 py-3 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => onLike?.(post.id)}
          className="flex-row items-center"
          testID={`${testID}-like`}
        >
          <Text className={`text-xl mr-1 ${post.isLiked ? '' : 'opacity-50'}`}>
            ❤️
          </Text>
          <Text
            className={`text-sm ${
              post.isLiked ? 'text-red-500 font-semibold' : 'text-gray-600'
            }`}
          >
            {post.likesCount > 0 ? post.likesCount : 'Like'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onComment?.(post.id)}
          className="flex-row items-center"
          testID={`${testID}-comment`}
        >
          <Text className="text-xl mr-1 opacity-50">💬</Text>
          <Text className="text-sm text-gray-600">
            {post.commentsCount > 0 ? post.commentsCount : 'Comment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onShare?.(post.id)}
          className="flex-row items-center"
          testID={`${testID}-share`}
        >
          <Text className="text-xl mr-1 opacity-50">↗️</Text>
          <Text className="text-sm text-gray-600">Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
