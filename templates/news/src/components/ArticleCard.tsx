import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { Article } from '@/types';
import { BookmarkButton } from './BookmarkButton';

interface ArticleCardProps {
  article: Article;
  compact?: boolean;
  testID?: string;
}

export function ArticleCard({ article, compact = false, testID }: ArticleCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/article/${article.id}`);
  };

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        className="flex-row bg-white rounded-lg overflow-hidden mb-3 shadow-sm"
        testID={testID}
      >
        <Image
          source={{ uri: article.image }}
          className="w-24 h-24"
          resizeMode="cover"
        />
        <View className="flex-1 p-3 justify-between">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
            {article.title}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-500">
              {article.publishedAt} · {article.readTime} min read
            </Text>
            <BookmarkButton articleId={article.id} size="small" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white rounded-xl overflow-hidden mb-4 shadow-sm"
      testID={testID}
    >
      <Image
        source={{ uri: article.image }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <Text
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ backgroundColor: article.category.color + '20', color: article.category.color }}
          >
            {article.category.name}
          </Text>
          <Text className="text-xs text-gray-500 ml-auto">
            {article.readTime} min read
          </Text>
        </View>
        <Text className="text-lg font-bold text-gray-900 mb-2">
          {article.title}
        </Text>
        <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
          {article.summary}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {article.author.avatar && (
              <Image
                source={{ uri: article.author.avatar }}
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <Text className="text-xs text-gray-500">
              {article.author.name} · {article.publishedAt}
            </Text>
          </View>
          <BookmarkButton articleId={article.id} />
        </View>
      </View>
    </Pressable>
  );
}
