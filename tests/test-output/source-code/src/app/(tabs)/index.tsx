import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { ArticleCard, FeaturedArticle } from '@/components';
import { useArticles, useFeaturedArticles } from '@/hooks';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { articles, isLoading, refetch } = useArticles();
  const { featuredArticles } = useFeaturedArticles();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Featured Section */}
        {featuredArticles.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 px-4 mb-3">
              Featured
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4"
            >
              {featuredArticles.map((article) => (
                <FeaturedArticle
                  key={article.id}
                  article={article}
                  testID={`featured-${article.id}`}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Latest Articles */}
        <View className="px-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Latest News
          </Text>
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              testID={`article-${article.id}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
