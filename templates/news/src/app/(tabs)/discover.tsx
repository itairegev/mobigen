import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ArticleCard, CategoryPill } from '@/components';
import { useArticles, useCategories } from '@/hooks';

export default function DiscoverScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { articles, isLoading: articlesLoading } = useArticles(selectedCategory);

  const isLoading = categoriesLoading || articlesLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      {/* Categories */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 py-3"
        >
          <CategoryPill
            category={{ id: 'all', name: 'All', slug: 'all', icon: '📰' }}
            isSelected={!selectedCategory}
            onPress={() => setSelectedCategory(undefined)}
            testID="category-all"
          />
          {categories.map((category) => (
            <CategoryPill
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.slug}
              onPress={() => setSelectedCategory(category.slug)}
              testID={`category-${category.slug}`}
            />
          ))}
        </ScrollView>
      </View>

      {/* Articles */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="p-4">
          {articles.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-gray-500 text-center">
                No articles found in this category
              </Text>
            </View>
          ) : (
            articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                compact
                testID={`discover-article-${article.id}`}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
