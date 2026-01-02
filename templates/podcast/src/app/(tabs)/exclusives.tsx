import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useExclusiveEpisodes } from '../../hooks/useEpisodes';
import { usePlayer } from '../../hooks';
import { EpisodeCard } from '../../components';
import { useRouter } from 'expo-router';
import { Lock, Crown } from 'lucide-react-native';

export default function ExclusivesScreen() {
  const router = useRouter();
  const { data: exclusiveEpisodes, isLoading } = useExclusiveEpisodes();
  const { loadAndPlay } = usePlayer();

  // Mock: Check if user is subscriber
  const isSubscriber = true;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <View className="p-6 bg-gradient-to-br from-primary-500 to-primary-700">
        <View className="flex-row items-center mb-2">
          <Crown size={24} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-2xl font-bold text-white ml-2">Exclusive Content</Text>
        </View>
        <Text className="text-primary-100">
          {isSubscriber
            ? 'Enjoy your subscriber-only episodes'
            : 'Subscribe to access exclusive content'}
        </Text>
      </View>

      {/* Episodes List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : !isSubscriber ? (
        <View className="flex-1 items-center justify-center p-8">
          <Lock size={64} color="#9ca3af" />
          <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
            Exclusive Access Required
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Subscribe to unlock exclusive episodes and bonus content
          </Text>
          {/* In a real app, this would navigate to subscription page */}
          <View className="bg-primary-500 rounded-lg px-8 py-3">
            <Text className="text-white font-semibold">Subscribe Now</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={exclusiveEpisodes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4">
              <EpisodeCard
                episode={item}
                onPress={() => router.push(`/episodes/${item.id}`)}
                onPlayPress={() => loadAndPlay(item)}
                testID={`exclusive-episode-${item.id}`}
              />
            </View>
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                No exclusive episodes available yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
