import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Game, GameLocation } from '@/types';
import { format } from 'date-fns';
import { Clock, MapPin } from 'lucide-react-native';

interface GameCardProps {
  game: Game;
  onPress?: () => void;
  testID?: string;
}

export function GameCard({ game, onPress, testID }: GameCardProps) {
  const isHome = game.homeTeam.id === 'team-1'; // OUR_TEAM
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const location: GameLocation = isHome ? 'home' : 'away';

  const statusColors = {
    upcoming: 'bg-blue-500',
    live: 'bg-red-500 animate-pulse',
    completed: 'bg-gray-500',
    cancelled: 'bg-gray-400',
    postponed: 'bg-yellow-500',
  };

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      className="bg-white rounded-xl shadow-md p-4 mb-3"
      testID={testID}
    >
      {/* Status Badge */}
      <View className="flex-row justify-between items-center mb-3">
        <View className={`${statusColors[game.status]} px-3 py-1 rounded-full`}>
          <Text className="text-white text-xs font-semibold uppercase">
            {game.status}
          </Text>
        </View>
        <Text className="text-gray-500 text-sm">
          {format(game.date, 'MMM d, yyyy')}
        </Text>
      </View>

      {/* Teams */}
      <View className="flex-row items-center justify-between mb-3">
        {/* Home Team */}
        <View className="flex-1 items-center">
          <Image
            source={{ uri: game.homeTeam.logo }}
            className="w-16 h-16 mb-2"
            resizeMode="contain"
          />
          <Text className="text-center font-semibold text-gray-900">
            {game.homeTeam.abbreviation}
          </Text>
        </View>

        {/* Score or Time */}
        <View className="px-4">
          {game.score ? (
            <View className="items-center">
              <Text className="text-3xl font-bold text-gray-900">
                {game.score.home} - {game.score.away}
              </Text>
              {game.status === 'live' && (
                <Text className="text-red-500 text-xs font-semibold mt-1">LIVE</Text>
              )}
            </View>
          ) : (
            <Text className="text-lg font-semibold text-gray-600">{game.time}</Text>
          )}
        </View>

        {/* Away Team */}
        <View className="flex-1 items-center">
          <Image
            source={{ uri: game.awayTeam.logo }}
            className="w-16 h-16 mb-2"
            resizeMode="contain"
          />
          <Text className="text-center font-semibold text-gray-900">
            {game.awayTeam.abbreviation}
          </Text>
        </View>
      </View>

      {/* Venue */}
      <View className="flex-row items-center justify-center border-t border-gray-200 pt-3">
        <MapPin size={14} color="#6b7280" />
        <Text className="text-gray-600 text-sm ml-1">{game.venue}</Text>
      </View>

      {/* Tickets (if upcoming) */}
      {game.status === 'upcoming' && game.tickets?.available && (
        <View className="mt-3 bg-blue-50 rounded-lg p-2">
          <Text className="text-blue-700 text-center text-xs font-semibold">
            🎟️ Tickets Available - {game.tickets.price}
          </Text>
        </View>
      )}
    </Wrapper>
  );
}
