import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { GameCard } from '@/components';
import { useGames } from '@/hooks/useGames';

type FilterType = 'all' | 'upcoming' | 'completed';

export default function ScheduleScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: games, isLoading } = useGames();

  const filteredGames = games?.filter((game) => {
    if (filter === 'all') return true;
    return game.status === filter;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Filter Tabs */}
        <View className="bg-white px-4 py-3 flex-row border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`flex-1 py-2 rounded-lg mr-2 ${
              filter === 'all' ? 'bg-team-primary' : 'bg-gray-100'
            }`}
            testID="filter-all"
          >
            <Text
              className={`text-center font-semibold ${
                filter === 'all' ? 'text-white' : 'text-gray-600'
              }`}
            >
              All Games
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('upcoming')}
            className={`flex-1 py-2 rounded-lg mr-2 ${
              filter === 'upcoming' ? 'bg-team-primary' : 'bg-gray-100'
            }`}
            testID="filter-upcoming"
          >
            <Text
              className={`text-center font-semibold ${
                filter === 'upcoming' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('completed')}
            className={`flex-1 py-2 rounded-lg ${
              filter === 'completed' ? 'bg-team-primary' : 'bg-gray-100'
            }`}
            testID="filter-completed"
          >
            <Text
              className={`text-center font-semibold ${
                filter === 'completed' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Results
            </Text>
          </TouchableOpacity>
        </View>

        {/* Games List */}
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1e40af" />
            </View>
          ) : filteredGames && filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => router.push(`/games/${game.id}`)}
                testID={`game-card-${game.id}`}
              />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-center text-lg">
                No {filter !== 'all' ? filter : ''} games found
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
