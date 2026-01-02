import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { GameCard, NewsItem, StandingsTable } from '@/components';
import { useNextGame, useRecentGames } from '@/hooks/useGames';
import { useLatestNews } from '@/hooks/useNews';
import { useStandings } from '@/hooks/useStandings';
import { ShoppingBag, Trophy } from 'lucide-react-native';

export default function HomeScreen() {
  const { data: nextGame, isLoading: loadingNextGame } = useNextGame();
  const { data: recentGames, isLoading: loadingRecent } = useRecentGames(2);
  const { data: latestNews, isLoading: loadingNews } = useLatestNews(2);
  const { data: standings, isLoading: loadingStandings } = useStandings();

  const topStandings = standings?.slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View className="bg-gradient-to-br from-team-primary to-team-secondary p-6 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-3xl font-bold">Thunder FC</Text>
            <TouchableOpacity
              onPress={() => router.push('/shop')}
              className="bg-white/20 rounded-full p-2"
              testID="shop-button"
            >
              <ShoppingBag size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-white/90 text-sm">Official Fan App</Text>
        </View>

        <View className="px-4">
          {/* Next Game Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-2xl font-bold text-gray-900">Next Game</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/schedule')}
                testID="view-schedule-button"
              >
                <Text className="text-team-primary font-semibold">View Schedule →</Text>
              </TouchableOpacity>
            </View>
            {loadingNextGame ? (
              <ActivityIndicator size="large" color="#1e40af" />
            ) : nextGame ? (
              <GameCard
                game={nextGame}
                onPress={() => router.push(`/games/${nextGame.id}`)}
                testID="next-game-card"
              />
            ) : (
              <Text className="text-gray-500 text-center py-8">No upcoming games</Text>
            )}
          </View>

          {/* Recent Results */}
          {recentGames && recentGames.length > 0 && (
            <View className="mb-6">
              <Text className="text-2xl font-bold text-gray-900 mb-3">Recent Results</Text>
              {loadingRecent ? (
                <ActivityIndicator size="large" color="#1e40af" />
              ) : (
                recentGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onPress={() => router.push(`/games/${game.id}`)}
                    testID={`recent-game-${game.id}`}
                  />
                ))
              )}
            </View>
          )}

          {/* League Standings Preview */}
          {topStandings && topStandings.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Trophy size={24} color="#1e40af" />
                <Text className="text-2xl font-bold text-gray-900 ml-2">Standings</Text>
              </View>
              {loadingStandings ? (
                <ActivityIndicator size="large" color="#1e40af" />
              ) : (
                <StandingsTable
                  standings={topStandings}
                  highlightTeamId="team-1"
                  testID="standings-table"
                />
              )}
            </View>
          )}

          {/* Latest News */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-2xl font-bold text-gray-900">Latest News</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/news')}
                testID="view-news-button"
              >
                <Text className="text-team-primary font-semibold">View All →</Text>
              </TouchableOpacity>
            </View>
            {loadingNews ? (
              <ActivityIndicator size="large" color="#1e40af" />
            ) : latestNews && latestNews.length > 0 ? (
              latestNews.map((article) => (
                <NewsItem
                  key={article.id}
                  article={article}
                  variant="list"
                  testID={`news-item-${article.id}`}
                />
              ))
            ) : (
              <Text className="text-gray-500 text-center py-8">No news available</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
