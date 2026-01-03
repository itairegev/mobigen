import { View, Text, ScrollView, Image, ActivityIndicator, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { BookmarkButton } from '@/components';
import { useArticle } from '@/hooks';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { article, isLoading } = useArticle(id);

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        message: `Check out this article: ${article.title}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Article not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/90 items-center justify-center"
            >
              <ArrowLeft size={20} color="#111827" />
            </Pressable>
          ),
          headerRight: () => (
            <View className="flex-row">
              <Pressable
                onPress={handleShare}
                className="w-10 h-10 rounded-full bg-white/90 items-center justify-center mr-2"
              >
                <Share2 size={20} color="#111827" />
              </Pressable>
              <View className="w-10 h-10 rounded-full bg-white/90 items-center justify-center">
                <BookmarkButton articleId={article.id} />
              </View>
            </View>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-white">
        {/* Hero Image */}
        {article.imageUrl && (
          <Image
            source={{ uri: article.imageUrl }}
            className="w-full h-72"
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View className="p-4 -mt-6 bg-white rounded-t-3xl">
          {/* Category Badge */}
          {article.category && (
            <View className="flex-row items-center mb-3">
              <Text
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  backgroundColor: (article.category.color || '#2563eb') + '20',
                  color: article.category.color || '#2563eb'
                }}
              >
                {article.category.name}
              </Text>
              <Text className="text-xs text-gray-500 ml-2">
                {article.readingTime || 5} min read
              </Text>
            </View>
          )}

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            {article.title}
          </Text>

          {/* Author & Source Info */}
          <View className="flex-row items-center mb-6 pb-4 border-b border-gray-100">
            <View>
              <Text className="text-sm font-medium text-gray-900">
                {article.author || 'TechNews Daily'}
              </Text>
              <Text className="text-xs text-gray-500">
                {article.source} · {new Date(article.publishedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Article Description */}
          {article.description && (
            <Text className="text-base text-gray-700 leading-7 mb-4 font-medium">
              {article.description}
            </Text>
          )}

          {/* Article Content */}
          <Text className="text-base text-gray-700 leading-7">
            {article.content}
          </Text>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View className="mt-6 pt-4 border-t border-gray-100">
              <Text className="text-sm font-medium text-gray-900 mb-2">Tags:</Text>
              <View className="flex-row flex-wrap">
                {article.tags.map((tag, index) => (
                  <Text key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full mr-2 mb-2">
                    {tag}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
