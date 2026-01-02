import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, MapPin, Users, Calendar, BookmarkPlus, BookmarkCheck } from 'lucide-react-native';
import { useSession } from '@/hooks/useSessions';
import { useSpeaker } from '@/hooks/useSpeakers';
import { useAgenda } from '@/hooks/useAgenda';
import { Button } from '@/components';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, isLoading } = useSession(id);
  const { addToAgenda, removeFromAgenda, isInAgenda } = useAgenda();

  const inAgenda = session ? isInAgenda(session.id) : false;

  // Get speaker details for the first speaker
  const { speaker } = useSpeaker(session?.speakerIds[0] || '');

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-600 dark:text-gray-400">Session not found</Text>
      </SafeAreaView>
    );
  }

  const startTime = new Date(session.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = new Date(session.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const date = new Date(session.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const capacityPercent = Math.round((session.enrolled / session.capacity) * 100);
  const isFull = capacityPercent >= 100;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView>
        <View className="p-4">
          {/* Track Badge */}
          <View
            className="px-4 py-2 rounded-full mb-4 self-start"
            style={{ backgroundColor: session.trackColor + '20' }}
          >
            <Text className="text-sm font-semibold" style={{ color: session.trackColor }}>
              {session.trackName}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {session.title}
          </Text>

          {/* Time & Location */}
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-3">
              <Calendar size={20} color="#1e3a8a" />
              <Text className="ml-2 text-gray-900 dark:text-white font-semibold">
                {date}
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <Clock size={20} color="#64748b" />
              <Text className="ml-2 text-gray-600 dark:text-gray-400">
                {startTime} - {endTime}
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <MapPin size={20} color="#64748b" />
              <Text className="ml-2 text-gray-600 dark:text-gray-400">
                {session.room}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Users size={20} color={isFull ? '#ef4444' : '#64748b'} />
              <Text
                className={`ml-2 ${isFull ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
              >
                {session.enrolled}/{session.capacity} enrolled
                {isFull && ' (Full)'}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              About This Session
            </Text>
            <Text className="text-gray-700 dark:text-gray-300 leading-6">
              {session.description}
            </Text>
          </View>

          {/* Level & Tags */}
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Details
            </Text>

            <View className="flex-row items-center mb-3">
              <Text className="text-gray-600 dark:text-gray-400 w-20">Level:</Text>
              <View className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded">
                <Text className="text-primary-700 dark:text-primary-300 capitalize font-semibold">
                  {session.level}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Text className="text-gray-600 dark:text-gray-400 w-20">Tags:</Text>
              <View className="flex-1 flex-row flex-wrap gap-2">
                {session.tags.map((tag) => (
                  <View key={tag} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                    <Text className="text-gray-700 dark:text-gray-300 text-sm">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Speaker */}
          {speaker && (
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Speaker
              </Text>
              <TouchableOpacity
                onPress={() => router.push(`/speakers/${speaker.id}`)}
                className="flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold text-lg">
                    {speaker.name}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    {speaker.title} at {speaker.company}
                  </Text>
                </View>
                <Text className="text-primary-500">View Profile →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Add to Agenda Button */}
          <View className="mt-4">
            {inAgenda ? (
              <Button
                title="Remove from Agenda"
                onPress={() => removeFromAgenda(session.id)}
                variant="outline"
                testID="remove-from-agenda-button"
              />
            ) : (
              <Button
                title="Add to My Agenda"
                onPress={() => addToAgenda(session.id, true)}
                variant="primary"
                testID="add-to-agenda-button"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
