import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSessions, useTracks } from '@/hooks/useSessions';
import { SessionCard, TrackFilter } from '@/components';

export default function ScheduleScreen() {
  const router = useRouter();
  const { sessions, isLoading } = useSessions();
  const { tracks } = useTracks();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const filteredSessions = selectedTrackId
    ? sessions.filter((s) => s.trackId === selectedTrackId)
    : sessions;

  // Group sessions by date
  const sessionsByDate = filteredSessions.reduce((acc, session) => {
    const date = new Date(session.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  // Sort sessions within each date by start time
  Object.keys(sessionsByDate).forEach((date) => {
    sessionsByDate[date].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 pt-4">
        <TrackFilter
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
          testID="track-filter"
        />
      </View>

      <FlatList
        data={Object.entries(sessionsByDate)}
        keyExtractor={([date]) => date}
        contentContainerClassName="px-4 pb-4"
        renderItem={({ item: [date, dateSessions] }) => (
          <View className="mb-6">
            <View className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 mb-3 shadow-sm">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {date}
              </Text>
            </View>
            {dateSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => router.push(`/sessions/${session.id}`)}
                testID={`session-${session.id}`}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-gray-500 dark:text-gray-400">
              {isLoading ? 'Loading schedule...' : 'No sessions found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
