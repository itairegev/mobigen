import { View, Text, Image } from 'react-native';
import { Game } from '@/types';

interface ScoreBoardProps {
  game: Game;
  testID?: string;
}

export function ScoreBoard({ game, testID }: ScoreBoardProps) {
  if (!game.score) {
    return null;
  }

  return (
    <View className="bg-white rounded-xl shadow-md p-6" testID={testID}>
      {/* Main Score */}
      <View className="flex-row items-center justify-between mb-6">
        {/* Home Team */}
        <View className="flex-1 items-center">
          <Image
            source={{ uri: game.homeTeam.logo }}
            className="w-20 h-20 mb-3"
            resizeMode="contain"
          />
          <Text className="text-center font-bold text-gray-900 text-lg mb-1">
            {game.homeTeam.name}
          </Text>
          <Text className="text-5xl font-bold text-team-primary">
            {game.score.home}
          </Text>
        </View>

        {/* Separator */}
        <View className="px-4">
          <Text className="text-3xl font-bold text-gray-400">-</Text>
        </View>

        {/* Away Team */}
        <View className="flex-1 items-center">
          <Image
            source={{ uri: game.awayTeam.logo }}
            className="w-20 h-20 mb-3"
            resizeMode="contain"
          />
          <Text className="text-center font-bold text-gray-900 text-lg mb-1">
            {game.awayTeam.name}
          </Text>
          <Text className="text-5xl font-bold text-gray-600">
            {game.score.away}
          </Text>
        </View>
      </View>

      {/* Period Scores */}
      {game.score.periods && game.score.periods.length > 0 && (
        <View className="border-t border-gray-200 pt-4">
          <Text className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Period Breakdown
          </Text>
          <View className="flex-row justify-between">
            {game.score.periods.map((period) => (
              <View key={period.period} className="flex-1 items-center">
                <Text className="text-xs text-gray-500 mb-1">P{period.period}</Text>
                <View className="flex-row">
                  <Text className="text-sm font-semibold text-gray-900">
                    {period.home}
                  </Text>
                  <Text className="text-sm text-gray-400 mx-1">-</Text>
                  <Text className="text-sm font-semibold text-gray-600">
                    {period.away}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Live Indicator */}
      {game.status === 'live' && (
        <View className="mt-4 bg-red-500 rounded-lg py-2">
          <Text className="text-white text-center font-bold uppercase">
            🔴 Live Now
          </Text>
        </View>
      )}
    </View>
  );
}
