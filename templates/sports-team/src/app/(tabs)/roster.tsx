import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { PlayerCard } from '@/components';
import { usePlayers } from '@/hooks/usePlayers';
import { PlayerPosition } from '@/types';

type PositionFilter = 'all' | PlayerPosition;

export default function RosterScreen() {
  const [filter, setFilter] = useState<PositionFilter>('all');
  const { data: players, isLoading } = usePlayers();

  const filteredPlayers = players?.filter((player) => {
    if (filter === 'all') return true;
    return player.position === filter;
  });

  const positions: PositionFilter[] = ['all', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Position Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white px-4 py-3 border-b border-gray-200"
          contentContainerClassName="gap-2"
        >
          {positions.map((position) => (
            <TouchableOpacity
              key={position}
              onPress={() => setFilter(position)}
              className={`px-4 py-2 rounded-full ${
                filter === position ? 'bg-team-primary' : 'bg-gray-100'
              }`}
              testID={`filter-${position.toLowerCase()}`}
            >
              <Text
                className={`font-semibold ${
                  filter === position ? 'text-white' : 'text-gray-600'
                }`}
              >
                {position === 'all' ? 'All Players' : position}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Players Grid */}
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1e40af" />
            </View>
          ) : filteredPlayers && filteredPlayers.length > 0 ? (
            <>
              <Text className="text-sm text-gray-500 mb-3">
                {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
              </Text>
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onPress={() => router.push(`/players/${player.id}`)}
                  testID={`player-card-${player.id}`}
                />
              ))}
            </>
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-center text-lg">No players found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
