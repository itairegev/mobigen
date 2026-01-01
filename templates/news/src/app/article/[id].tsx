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
        <ActivityIndicator size="large" color="#3b82f6" />
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
        <Image
          source={{ uri: article.image }}
          className="w-full h-72"
          resizeMode="cover"
        />

        {/* Content */}
        <View className="p-4 -mt-6 bg-white rounded-t-3xl">
          {/* Category Badge */}
          <View className="flex-row items-center mb-3">
            <Text
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                backgroundColor: article.category.color + '20',
                color: article.category.color
              }}
            >
              {article.category.name}
            </Text>
            <Text className="text-xs text-gray-500 ml-2">
              {article.readTime} min read
            </Text>
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            {article.title}
          </Text>

          {/* Author Info */}
          <View className="flex-row items-center mb-6 pb-4 border-b border-gray-100">
            {article.author.avatar && (
              <Image
                source={{ uri: article.author.avatar }}
                className="w-10 h-10 rounded-full mr-3"
              />
            )}
            <View>
              <Text className="text-sm font-medium text-gray-900">
                {article.author.name}
              </Text>
              <Text className="text-xs text-gray-500">
                {article.publishedAt}
              </Text>
            </View>
          </View>

          {/* Article Summary */}
          <Text className="text-base text-gray-700 leading-7 mb-4">
            {article.summary}
          </Text>

          {/* Placeholder for full content */}
          <Text className="text-base text-gray-700 leading-7">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            {'\n\n'}
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
            sunt in culpa qui officia deserunt mollit anim id est laborum.
            {'\n\n'}
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
            doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
            veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
