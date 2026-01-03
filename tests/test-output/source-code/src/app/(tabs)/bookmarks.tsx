import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark } from 'lucide-react-native';
import { ArticleCard } from '@/components';
import { useArticles, useBookmarks } from '@/hooks';

export default function BookmarksScreen() {
  const { bookmarkedIds, bookmarkCount } = useBookmarks();
  const { articles, isLoading } = useArticles();

  const bookmarkedArticles = articles.filter((article) =>
    bookmarkedIds.includes(article.id)
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {bookmarkCount === 0 ? (
          <View className="items-center justify-center py-12">
            <Bookmark size={48} color="#9ca3af" />
            <Text className="text-lg font-semibold text-gray-700 mt-4 mb-2">
              No saved articles
            </Text>
            <Text className="text-gray-500 text-center px-8">
              Bookmark articles to read later. They'll appear here.
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-sm text-gray-500 mb-4">
              {bookmarkCount} saved {bookmarkCount === 1 ? 'article' : 'articles'}
            </Text>
            {bookmarkedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                testID={`bookmark-${article.id}`}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
