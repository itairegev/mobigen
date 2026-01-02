import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFeaturedEpisodes } from '../../hooks/useEpisodes';
import { usePlayer } from '../../hooks';
import { EpisodeCard } from '../../components';
import { useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { data: featuredEpisodes, isLoading } = useFeaturedEpisodes(5);
  const { loadAndPlay } = usePlayer();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const latestEpisode = featuredEpisodes?.[0];

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      {/* Hero Section - Latest Episode */}
      {latestEpisode && (
        <View className="relative" testID="hero-section">
          <Image
            source={{ uri: latestEpisode.imageUrl || 'https://via.placeholder.com/400' }}
            className="w-full h-80"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

          <View className="absolute bottom-0 left-0 right-0 p-6">
            <Text className="text-xs text-primary-400 font-semibold mb-2 uppercase">
              Latest Episode
            </Text>
            <Text className="text-2xl font-bold text-white mb-2" numberOfLines={2}>
              {latestEpisode.title}
            </Text>
            <Text className="text-gray-300 mb-4" numberOfLines={2}>
              {latestEpisode.description}
            </Text>

            <TouchableOpacity
              onPress={() => loadAndPlay(latestEpisode)}
              className="bg-primary-500 rounded-full flex-row items-center justify-center py-3 px-6"
              testID="play-latest"
            >
              <Play size={20} color="white" fill="white" />
              <Text className="text-white font-semibold ml-2">Play Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Featured Episodes */}
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Featured Episodes
        </Text>

        {featuredEpisodes?.slice(1).map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            onPress={() => router.push(`/episodes/${episode.id}`)}
            onPlayPress={() => loadAndPlay(episode)}
            testID={`episode-${episode.id}`}
          />
        ))}

        <TouchableOpacity
          onPress={() => router.push('/episodes')}
          className="mt-4 p-4 border border-primary-500 rounded-lg"
          testID="view-all-episodes"
        >
          <Text className="text-primary-500 font-semibold text-center">
            View All Episodes
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
