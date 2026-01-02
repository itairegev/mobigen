import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Article } from '@/types';
import { format } from 'date-fns';
import { Clock } from 'lucide-react-native';

interface ArticleCardProps {
  article: Article;
  onPress?: () => void;
  testID?: string;
}

export function ArticleCard({ article, onPress, testID }: ArticleCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-md mb-4 overflow-hidden"
      testID={testID}
    >
      <Image
        source={{ uri: article.image }}
        className="w-full h-48 bg-gray-200"
        resizeMode="cover"
      />

      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <Text className="text-xs font-semibold text-primary-600 uppercase">
            {article.category}
          </Text>
          <View className="flex-row items-center ml-auto">
            <Clock size={12} color="#64748b" />
            <Text className="text-xs text-gray-500 ml-1">
              {article.readTime} min read
            </Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-2">
          {article.title}
        </Text>

        <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
          {article.excerpt}
        </Text>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-500">By {article.author}</Text>
          <Text className="text-xs text-gray-500">
            {format(article.publishedAt, 'MMM d, yyyy')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
