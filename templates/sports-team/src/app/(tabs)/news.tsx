import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { NewsItem } from '@/components';
import { useNews } from '@/hooks/useNews';
import { NewsArticle } from '@/types';

type CategoryFilter = 'all' | NewsArticle['category'];

export default function NewsScreen() {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const { data: news, isLoading } = useNews();

  const filteredNews = news?.filter((article) => {
    if (filter === 'all') return true;
    return article.category === filter;
  });

  const categories: CategoryFilter[] = [
    'all',
    'match-report',
    'transfer',
    'injury',
    'interview',
    'announcement',
  ];

  const getCategoryLabel = (category: CategoryFilter) => {
    if (category === 'all') return 'All News';
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white px-4 py-3 border-b border-gray-200"
          contentContainerClassName="gap-2"
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setFilter(category)}
              className={`px-4 py-2 rounded-full ${
                filter === category ? 'bg-team-primary' : 'bg-gray-100'
              }`}
              testID={`filter-${category}`}
            >
              <Text
                className={`font-semibold ${
                  filter === category ? 'text-white' : 'text-gray-600'
                }`}
              >
                {getCategoryLabel(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* News Feed */}
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1e40af" />
            </View>
          ) : filteredNews && filteredNews.length > 0 ? (
            filteredNews.map((article) => (
              <NewsItem
                key={article.id}
                article={article}
                testID={`news-article-${article.id}`}
              />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-center text-lg">No news articles found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
