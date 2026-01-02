import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Play, Volume2, Calendar, User, Clock, BookOpen } from 'lucide-react-native';
import { useSermon } from '../../hooks/useSermons';

export default function SermonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: sermon, isLoading } = useSermon(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      </SafeAreaView>
    );
  }

  if (!sermon) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center">Sermon not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = sermon.date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Sermon Image */}
        <Image
          source={{ uri: sermon.thumbnail }}
          className="w-full h-64"
          resizeMode="cover"
        />

        <View className="px-6 py-6">
          {/* Title */}
          <Text className="text-3xl font-bold text-gray-900 mb-4">{sermon.title}</Text>

          {/* Meta Info */}
          <View className="space-y-2 mb-6">
            <View className="flex-row items-center">
              <User size={18} color="#64748b" />
              <Text className="text-base text-gray-600 ml-2">{sermon.speaker}</Text>
            </View>

            <View className="flex-row items-center">
              <Calendar size={18} color="#64748b" />
              <Text className="text-base text-gray-600 ml-2">{formattedDate}</Text>
            </View>

            <View className="flex-row items-center">
              <Clock size={18} color="#64748b" />
              <Text className="text-base text-gray-600 ml-2">{sermon.duration} minutes</Text>
            </View>

            {sermon.scripture && (
              <View className="flex-row items-center">
                <BookOpen size={18} color="#64748b" />
                <Text className="text-base text-gray-600 ml-2">{sermon.scripture}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="space-y-3 mb-6">
            {sermon.videoUrl && (
              <TouchableOpacity
                className="bg-primary-600 rounded-xl p-4 flex-row items-center justify-center"
                testID="watch-video-button"
              >
                <Play size={24} color="#ffffff" fill="#ffffff" />
                <Text className="text-white font-bold text-lg ml-2">Watch Video</Text>
              </TouchableOpacity>
            )}

            {sermon.audioUrl && (
              <TouchableOpacity
                className="bg-gray-100 rounded-xl p-4 flex-row items-center justify-center"
                testID="listen-audio-button"
              >
                <Volume2 size={24} color="#1e40af" />
                <Text className="text-primary-600 font-bold text-lg ml-2">Listen to Audio</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">About This Sermon</Text>
            <Text className="text-base text-gray-700 leading-6">{sermon.description}</Text>
          </View>

          {/* Notes */}
          {sermon.notes && (
            <View className="bg-primary-50 rounded-xl p-4">
              <Text className="text-lg font-bold text-primary-900 mb-2">Scripture</Text>
              <Text className="text-base text-primary-800 leading-6">{sermon.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
