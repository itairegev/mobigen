import { View, Text, TouchableOpacity, Image } from 'react-native';
import { NewsArticle } from '@/types';
import { format } from 'date-fns';
import { Clock } from 'lucide-react-native';

interface NewsItemProps {
  article: NewsArticle;
  onPress?: () => void;
  variant?: 'card' | 'list';
  testID?: string;
}

export function NewsItem({ article, onPress, variant = 'card', testID }: NewsItemProps) {
  const categoryColors = {
    'match-report': 'bg-blue-100 text-blue-700',
    transfer: 'bg-green-100 text-green-700',
    injury: 'bg-red-100 text-red-700',
    interview: 'bg-purple-100 text-purple-700',
    announcement: 'bg-yellow-100 text-yellow-700',
    general: 'bg-gray-100 text-gray-700',
  };

  const Wrapper = onPress ? TouchableOpacity : View;

  if (variant === 'list') {
    return (
      <Wrapper
        onPress={onPress}
        className="bg-white rounded-lg shadow-sm p-3 mb-2 flex-row"
        testID={testID}
      >
        <Image
          source={{ uri: article.image }}
          className="w-20 h-20 rounded-lg mr-3"
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 mb-1" numberOfLines={2}>
            {article.title}
          </Text>
          <Text className="text-xs text-gray-500">
            {format(article.publishedAt, 'MMM d, yyyy')} • {article.author}
          </Text>
        </View>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      onPress={onPress}
      className="bg-white rounded-xl shadow-md overflow-hidden mb-4"
      testID={testID}
    >
      {/* Article Image */}
      <Image
        source={{ uri: article.image }}
        className="w-full h-48"
        resizeMode="cover"
      />

      {/* Content */}
      <View className="p-4">
        {/* Category Badge */}
        <View className="mb-2">
          <View
            className={`${categoryColors[article.category]} px-3 py-1 rounded-full self-start`}
          >
            <Text className="text-xs font-semibold uppercase">
              {article.category.replace('-', ' ')}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-xl font-bold text-gray-900 mb-2" numberOfLines={2}>
          {article.title}
        </Text>

        {/* Summary */}
        <Text className="text-gray-600 mb-3" numberOfLines={3}>
          {article.summary}
        </Text>

        {/* Meta */}
        <View className="flex-row items-center border-t border-gray-200 pt-3">
          <Clock size={14} color="#6b7280" />
          <Text className="text-sm text-gray-500 ml-1">
            {format(article.publishedAt, 'MMM d, yyyy')}
          </Text>
          <Text className="text-gray-300 mx-2">•</Text>
          <Text className="text-sm text-gray-500">{article.author}</Text>
        </View>
      </View>
    </Wrapper>
  );
}
