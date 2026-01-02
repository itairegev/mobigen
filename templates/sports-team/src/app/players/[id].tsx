import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { StatsGrid } from '@/components';
import { usePlayer } from '@/hooks/usePlayers';
import { Twitter, Instagram } from 'lucide-react-native';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: player, isLoading } = usePlayer(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      </SafeAreaView>
    );
  }

  if (!player) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg">Player not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = [];
  if (player.stats.goals !== undefined) stats.push({ label: 'Goals', value: player.stats.goals });
  if (player.stats.assists !== undefined)
    stats.push({ label: 'Assists', value: player.stats.assists });
  stats.push(
    { label: 'Games', value: player.stats.gamesPlayed },
    { label: 'Started', value: player.stats.gamesStarted },
    { label: 'Minutes', value: player.stats.minutes }
  );
  if (player.stats.yellowCards !== undefined)
    stats.push({ label: 'Yellow Cards', value: player.stats.yellowCards });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View className="relative">
          <Image source={{ uri: player.photo }} className="w-full h-80" resizeMode="cover" />
          {/* Jersey Number Overlay */}
          <View className="absolute top-4 right-4 bg-team-primary rounded-full w-16 h-16 items-center justify-center">
            <Text className="text-white text-3xl font-bold">{player.number}</Text>
          </View>
        </View>

        <View className="p-4">
          {/* Player Info */}
          <View className="bg-white rounded-xl shadow-md p-6 mb-4">
            <Text className="text-3xl font-bold text-gray-900 mb-2">{player.name}</Text>
            <Text className="text-xl text-team-secondary font-semibold mb-4">
              {player.position}
            </Text>

            <View className="flex-row flex-wrap gap-4">
              <View className="flex-1 min-w-[100px]">
                <Text className="text-sm text-gray-500">Age</Text>
                <Text className="text-lg font-semibold text-gray-900">{player.age}</Text>
              </View>
              <View className="flex-1 min-w-[100px]">
                <Text className="text-sm text-gray-500">Height</Text>
                <Text className="text-lg font-semibold text-gray-900">{player.height}</Text>
              </View>
              <View className="flex-1 min-w-[100px]">
                <Text className="text-sm text-gray-500">Weight</Text>
                <Text className="text-lg font-semibold text-gray-900">{player.weight}</Text>
              </View>
              <View className="flex-1 min-w-[100px]">
                <Text className="text-sm text-gray-500">Nationality</Text>
                <Text className="text-lg font-semibold text-gray-900">{player.nationality}</Text>
              </View>
            </View>

            {/* Social Media */}
            {player.socialMedia && (
              <View className="flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
                {player.socialMedia.twitter && (
                  <TouchableOpacity
                    className="flex-row items-center bg-blue-100 px-4 py-2 rounded-lg"
                    onPress={() =>
                      Linking.openURL(`https://twitter.com/${player.socialMedia?.twitter}`)
                    }
                  >
                    <Twitter size={20} color="#1DA1F2" />
                    <Text className="ml-2 text-blue-600 font-semibold">
                      {player.socialMedia.twitter}
                    </Text>
                  </TouchableOpacity>
                )}
                {player.socialMedia.instagram && (
                  <TouchableOpacity
                    className="flex-row items-center bg-pink-100 px-4 py-2 rounded-lg"
                    onPress={() =>
                      Linking.openURL(`https://instagram.com/${player.socialMedia?.instagram}`)
                    }
                  >
                    <Instagram size={20} color="#E4405F" />
                    <Text className="ml-2 text-pink-600 font-semibold">
                      {player.socialMedia.instagram}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Biography */}
          {player.bio && (
            <View className="bg-white rounded-xl shadow-md p-6 mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-3">About</Text>
              <Text className="text-gray-600 leading-6">{player.bio}</Text>
            </View>
          )}

          {/* Season Statistics */}
          <View className="mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-3">Season Statistics</Text>
            <StatsGrid stats={stats} columns={3} testID="player-stats" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
