import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ScoreBoard, StatsGrid } from '@/components';
import { useGame } from '@/hooks/useGames';
import { format } from 'date-fns';
import { MapPin, Tv, Radio, Ticket } from 'lucide-react-native';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: game, isLoading } = useGame(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg">Game not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleTicketPress = () => {
    if (game.tickets?.url) {
      Linking.openURL(game.tickets.url);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Date & Venue */}
          <View className="bg-white rounded-xl shadow-md p-4 mb-4">
            <Text className="text-center text-gray-500 text-sm mb-1">
              {format(game.date, 'EEEE, MMMM d, yyyy')}
            </Text>
            <Text className="text-center text-gray-900 text-2xl font-bold mb-3">
              {game.time}
            </Text>
            <View className="flex-row items-center justify-center">
              <MapPin size={16} color="#6b7280" />
              <Text className="text-gray-600 ml-1">{game.venue}</Text>
            </View>
          </View>

          {/* Score Board */}
          {game.score ? (
            <ScoreBoard game={game} testID="game-scoreboard" />
          ) : (
            <View className="bg-white rounded-xl shadow-md p-6 mb-4">
              <Text className="text-center text-gray-500 text-lg mb-4">
                Match Preview
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 items-center">
                  <Text className="text-center font-bold text-gray-900 text-xl">
                    {game.homeTeam.name}
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-400 px-4">vs</Text>
                <View className="flex-1 items-center">
                  <Text className="text-center font-bold text-gray-900 text-xl">
                    {game.awayTeam.name}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Match Stats */}
          {game.stats && game.score && (
            <View className="mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-3">Match Statistics</Text>
              <View className="bg-white rounded-xl shadow-md p-4">
                {game.stats.possession && (
                  <View className="mb-4">
                    <Text className="text-center text-sm text-gray-600 mb-2">
                      Possession
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="w-12 text-right font-bold text-team-primary">
                        {game.stats.possession.home}%
                      </Text>
                      <View className="flex-1 mx-3 h-6 bg-gray-200 rounded-full overflow-hidden flex-row">
                        <View
                          className="bg-team-primary h-full"
                          style={{ width: `${game.stats.possession.home}%` }}
                        />
                        <View
                          className="bg-gray-500 h-full"
                          style={{ width: `${game.stats.possession.away}%` }}
                        />
                      </View>
                      <Text className="w-12 text-left font-bold text-gray-600">
                        {game.stats.possession.away}%
                      </Text>
                    </View>
                  </View>
                )}

                {/* Other Stats */}
                <View className="space-y-2">
                  {game.stats.shots && (
                    <StatRow
                      label="Shots"
                      home={game.stats.shots.home}
                      away={game.stats.shots.away}
                    />
                  )}
                  {game.stats.fouls && (
                    <StatRow
                      label="Fouls"
                      home={game.stats.fouls.home}
                      away={game.stats.fouls.away}
                    />
                  )}
                  {game.stats.corners && (
                    <StatRow
                      label="Corners"
                      home={game.stats.corners.home}
                      away={game.stats.corners.away}
                    />
                  )}
                  {game.stats.yellowCards && (
                    <StatRow
                      label="Yellow Cards"
                      home={game.stats.yellowCards.home}
                      away={game.stats.yellowCards.away}
                    />
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Broadcast Info */}
          {game.broadcast && (
            <View className="bg-white rounded-xl shadow-md p-4 mb-4">
              <Text className="font-bold text-gray-900 mb-3 text-lg">
                Watch & Listen
              </Text>
              {game.broadcast.tv && (
                <View className="flex-row items-center mb-2">
                  <Tv size={20} color="#1e40af" />
                  <Text className="ml-2 text-gray-600">TV: {game.broadcast.tv}</Text>
                </View>
              )}
              {game.broadcast.radio && (
                <View className="flex-row items-center mb-2">
                  <Radio size={20} color="#1e40af" />
                  <Text className="ml-2 text-gray-600">Radio: {game.broadcast.radio}</Text>
                </View>
              )}
              {game.broadcast.streaming && (
                <View className="flex-row items-center">
                  <Tv size={20} color="#1e40af" />
                  <Text className="ml-2 text-gray-600">
                    Streaming: {game.broadcast.streaming}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Tickets */}
          {game.status === 'upcoming' && game.tickets?.available && (
            <TouchableOpacity
              className="bg-team-primary rounded-xl shadow-md p-4 flex-row items-center justify-center"
              onPress={handleTicketPress}
              testID="buy-tickets-button"
            >
              <Ticket size={24} color="white" />
              <View className="ml-3">
                <Text className="text-white font-bold text-lg">Get Tickets</Text>
                <Text className="text-white/90 text-sm">{game.tickets.price}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
      <Text className="w-12 text-right font-semibold text-team-primary">{home}</Text>
      <Text className="flex-1 text-center text-sm text-gray-600">{label}</Text>
      <Text className="w-12 text-left font-semibold text-gray-600">{away}</Text>
    </View>
  );
}
