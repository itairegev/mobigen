import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Player } from '@/types';

interface PlayerCardProps {
  player: Player;
  onPress?: () => void;
  testID?: string;
}

export function PlayerCard({ player, onPress, testID }: PlayerCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      className="bg-white rounded-xl shadow-md overflow-hidden mb-3"
      testID={testID}
    >
      {/* Player Photo */}
      <View className="relative">
        <Image
          source={{ uri: player.photo }}
          className="w-full h-48"
          resizeMode="cover"
        />
        {/* Jersey Number Badge */}
        <View className="absolute top-2 right-2 bg-team-primary rounded-full w-12 h-12 items-center justify-center">
          <Text className="text-white text-xl font-bold">{player.number}</Text>
        </View>
      </View>

      {/* Player Info */}
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900 mb-1">{player.name}</Text>
        <Text className="text-team-secondary font-semibold mb-2">
          {player.position}
        </Text>

        {/* Stats Row */}
        <View className="flex-row justify-between border-t border-gray-200 pt-3">
          {player.stats.goals !== undefined && (
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {player.stats.goals}
              </Text>
              <Text className="text-xs text-gray-500 uppercase">Goals</Text>
            </View>
          )}
          {player.stats.assists !== undefined && (
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {player.stats.assists}
              </Text>
              <Text className="text-xs text-gray-500 uppercase">Assists</Text>
            </View>
          )}
          <View className="items-center">
            <Text className="text-2xl font-bold text-gray-900">
              {player.stats.gamesPlayed}
            </Text>
            <Text className="text-xs text-gray-500 uppercase">Games</Text>
          </View>
        </View>
      </View>
    </Wrapper>
  );
}
