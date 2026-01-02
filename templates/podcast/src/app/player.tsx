import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayer } from '../hooks';
import { PlaybackSpeed } from '../components';
import { formatDuration } from '../utils';
import { ChevronDown, MoreVertical, Play, Pause, SkipBack, SkipForward, Gauge } from 'lucide-react-native';
import { useState } from 'react';
import { ProgressSlider } from '../components';

export default function PlayerScreen() {
  const router = useRouter();
  const {
    currentEpisode,
    isPlaying,
    position,
    duration,
    settings,
    play,
    pause,
    skipForward,
    skipBackward,
    seekTo,
    setSpeed,
  } = usePlayer();

  const [showSpeedModal, setShowSpeedModal] = useState(false);

  if (!currentEpisode) {
    router.back();
    return null;
  }

  return (
    <View className="flex-1 bg-podcast-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} testID="close-player">
          <ChevronDown size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-sm font-medium">Now Playing</Text>
        <TouchableOpacity testID="player-menu">
          <MoreVertical size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Episode Artwork */}
        <View className="items-center px-8 mt-8">
          <Image
            source={{ uri: currentEpisode.imageUrl || 'https://via.placeholder.com/300' }}
            className="w-80 h-80 rounded-2xl shadow-2xl"
            resizeMode="cover"
          />
        </View>

        {/* Episode Info */}
        <View className="px-8 mt-8">
          <Text className="text-white text-2xl font-bold text-center mb-2">
            {currentEpisode.title}
          </Text>
          <Text className="text-gray-400 text-center">
            Episode {currentEpisode.episodeNumber} • Season {currentEpisode.season}
          </Text>
        </View>

        {/* Progress Slider */}
        <View className="px-8 mt-8">
          <ProgressSlider
            position={position}
            duration={duration}
            onSeek={seekTo}
            testID="player-progress"
          />

          {/* Time Labels */}
          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-400 text-sm">{formatDuration(position)}</Text>
            <Text className="text-gray-400 text-sm">{formatDuration(duration)}</Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View className="px-8 mt-8">
          <View className="flex-row items-center justify-center space-x-8">
            <TouchableOpacity
              onPress={skipBackward}
              className="p-3"
              testID="player-skip-back"
            >
              <SkipBack size={36} color="white" />
              <Text className="text-white text-xs text-center mt-1">
                {settings.skipBackward}s
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (isPlaying ? pause() : play())}
              className="bg-white rounded-full p-5"
              testID="player-play-pause"
            >
              {isPlaying ? (
                <Pause size={40} color="#1e1b4b" fill="#1e1b4b" />
              ) : (
                <Play size={40} color="#1e1b4b" fill="#1e1b4b" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={skipForward}
              className="p-3"
              testID="player-skip-forward"
            >
              <SkipForward size={36} color="white" />
              <Text className="text-white text-xs text-center mt-1">
                {settings.skipForward}s
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Playback Speed */}
        <View className="px-8 mt-8 mb-8">
          <TouchableOpacity
            onPress={() => setShowSpeedModal(true)}
            className="flex-row items-center justify-center bg-white/10 rounded-lg py-3"
            testID="speed-button"
          >
            <Gauge size={20} color="white" />
            <Text className="text-white font-medium ml-2">
              Speed: {settings.speed}x
            </Text>
          </TouchableOpacity>
        </View>

        {/* Show Notes Preview */}
        <View className="px-8 mb-8">
          <Text className="text-white font-semibold text-lg mb-3">About this episode</Text>
          <Text className="text-gray-400 leading-6" numberOfLines={4}>
            {currentEpisode.description}
          </Text>
          <TouchableOpacity className="mt-3">
            <Text className="text-primary-400 font-medium">Read more</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Playback Speed Modal */}
      <PlaybackSpeed
        visible={showSpeedModal}
        currentSpeed={settings.speed}
        onClose={() => setShowSpeedModal(false)}
        onSelectSpeed={setSpeed}
        testID="speed-modal"
      />
    </View>
  );
}
