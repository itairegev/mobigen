import { View, Text, Image, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { Article } from '@/types';

const { width } = Dimensions.get('window');

interface FeaturedArticleProps {
  article: Article;
  testID?: string;
}

export function FeaturedArticle({ article, testID }: FeaturedArticleProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/article/${article.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mr-4 rounded-2xl overflow-hidden"
      style={{ width: width - 48 }}
      testID={testID}
    >
      {article.imageUrl && (
        <Image
          source={{ uri: article.imageUrl }}
          className="w-full h-56"
          resizeMode="cover"
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        className="absolute bottom-0 left-0 right-0 h-32 justify-end p-4"
      >
        {article.category && (
          <View className="flex-row items-center mb-2">
            <Text
              className="text-xs font-medium px-2 py-1 rounded-full bg-white/20"
              style={{ color: 'white' }}
            >
              {article.category.icon} {article.category.name}
            </Text>
          </View>
        )}
        <Text className="text-lg font-bold text-white mb-1" numberOfLines={2}>
          {article.title}
        </Text>
        <Text className="text-xs text-white/80">
          {article.author ? `${article.author} · ` : ''}{article.readingTime || 5} min read
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
