import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getArticles, ARTICLE_CATEGORIES } from '@/services';
import { ArticleCard } from '@/components';

export default function ArticlesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles', selectedCategory],
    queryFn: () =>
      selectedCategory ? getArticles(selectedCategory) : getArticles(),
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Pet Care Articles
          </Text>
          <Text className="text-gray-600">
            Expert tips and advice for your pets
          </Text>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 py-4 border-b border-gray-200 bg-white"
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            className={`mr-3 px-4 py-2 rounded-full ${
              selectedCategory === null ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            testID="category-all"
          >
            <Text
              className={`font-semibold ${
                selectedCategory === null ? 'text-white' : 'text-gray-700'
              }`}
            >
              All
            </Text>
          </TouchableOpacity>

          {ARTICLE_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                className={`mr-3 px-4 py-2 rounded-full ${
                  isSelected ? 'bg-primary-500' : 'bg-gray-100'
                }`}
                testID={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Text
                  className={`font-semibold ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Articles */}
        <ScrollView className="flex-1 px-6 py-4">
          {isLoading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">Loading articles...</Text>
            </View>
          ) : (
            articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onPress={() => console.log('View article:', article.id)}
                testID={`article-${article.id}`}
              />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
