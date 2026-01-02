import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Briefcase, Twitter, Linkedin, Globe } from 'lucide-react-native';
import { useSpeaker } from '@/hooks/useSpeakers';
import { useSessions } from '@/hooks/useSessions';
import { SessionCard } from '@/components';

export default function SpeakerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { speaker, isLoading } = useSpeaker(id);
  const { sessions } = useSessions();

  const speakerSessions = sessions.filter((s) => s.speakerIds.includes(id));

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </SafeAreaView>
    );
  }

  if (!speaker) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-600 dark:text-gray-400">Speaker not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView>
        <View className="p-4">
          {/* Profile Header */}
          <View className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4 items-center shadow-sm">
            <Image
              source={{ uri: speaker.avatar }}
              className="w-32 h-32 rounded-full mb-4"
              resizeMode="cover"
            />

            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              {speaker.name}
            </Text>

            <View className="flex-row items-center mb-2">
              <Briefcase size={16} color="#64748b" />
              <Text className="ml-2 text-gray-600 dark:text-gray-400">
                {speaker.title}
              </Text>
            </View>

            <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-4">
              {speaker.company}
            </Text>

            {/* Social Links */}
            <View className="flex-row gap-4">
              {speaker.twitter && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://twitter.com/${speaker.twitter}`)}
                  className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full"
                >
                  <Twitter size={20} color="#1DA1F2" />
                </TouchableOpacity>
              )}
              {speaker.linkedin && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://linkedin.com/in/${speaker.linkedin}`)}
                  className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full"
                >
                  <Linkedin size={20} color="#0A66C2" />
                </TouchableOpacity>
              )}
              {speaker.website && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(speaker.website!)}
                  className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full"
                >
                  <Globe size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bio */}
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              About
            </Text>
            <Text className="text-gray-700 dark:text-gray-300 leading-6">
              {speaker.bio}
            </Text>
          </View>

          {/* Sessions */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Sessions ({speakerSessions.length})
            </Text>
            {speakerSessions.length > 0 ? (
              speakerSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => router.push(`/sessions/${session.id}`)}
                  testID={`session-${session.id}`}
                />
              ))
            ) : (
              <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <Text className="text-gray-600 dark:text-gray-400 text-center">
                  No sessions scheduled
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
