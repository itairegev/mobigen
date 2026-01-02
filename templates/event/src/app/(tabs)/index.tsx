import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Users, MapPin, Star, TrendingUp } from 'lucide-react-native';
import { useSessions } from '@/hooks/useSessions';
import { useSpeakers } from '@/hooks/useSpeakers';
import { SessionCard } from '@/components';

export default function HomeScreen() {
  const router = useRouter();
  const { sessions, isLoading } = useSessions();
  const { speakers } = useSpeakers();

  // Get featured/upcoming sessions (next 3)
  const now = new Date();
  const upcomingSessions = sessions
    .filter((s) => new Date(s.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  // Get keynote sessions
  const keynoteSessions = sessions.filter((s) => s.trackId === 'keynote');

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView>
        {/* Hero Section */}
        <View className="bg-primary-500 p-6 mb-4">
          <Text className="text-3xl font-bold text-white mb-2">
            TechConf 2026
          </Text>
          <Text className="text-white text-lg mb-4">
            March 15-16, 2026
          </Text>
          <Text className="text-white/90">
            San Francisco Convention Center
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="flex-row px-4 mb-6">
          <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 mr-2 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Calendar size={20} color="#1e3a8a" />
              <Text className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                {sessions.length}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 dark:text-gray-400">Sessions</Text>
          </View>

          <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 ml-2 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Users size={20} color="#1e3a8a" />
              <Text className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                {speakers.length}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 dark:text-gray-400">Speakers</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/schedule')}
              className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
              testID="view-schedule-button"
            >
              <Calendar size={24} color="#1e3a8a" />
              <Text className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                Schedule
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/map')}
              className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
              testID="venue-map-button"
            >
              <MapPin size={24} color="#1e3a8a" />
              <Text className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                Venue Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/agenda')}
              className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
              testID="my-agenda-button"
            >
              <Star size={24} color="#fb923c" />
              <Text className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                My Agenda
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Keynote Sessions */}
        {keynoteSessions.length > 0 && (
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Keynote Sessions
              </Text>
              <TrendingUp size={20} color="#f59e0b" />
            </View>
            {keynoteSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => router.push(`/sessions/${session.id}`)}
                testID={`keynote-session-${session.id}`}
              />
            ))}
          </View>
        )}

        {/* Upcoming Sessions */}
        <View className="px-4 mb-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Coming Up Next
          </Text>
          {isLoading ? (
            <Text className="text-gray-600 dark:text-gray-400">Loading sessions...</Text>
          ) : upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => router.push(`/sessions/${session.id}`)}
                testID={`upcoming-session-${session.id}`}
              />
            ))
          ) : (
            <Text className="text-gray-600 dark:text-gray-400">
              No upcoming sessions
            </Text>
          )}
        </View>

        {/* Announcements */}
        <View className="px-4 mb-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Announcements
          </Text>
          <View className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4">
            <Text className="text-sm font-semibold text-accent-900 dark:text-accent-100 mb-1">
              🎉 Welcome to TechConf 2026!
            </Text>
            <Text className="text-sm text-accent-800 dark:text-accent-200">
              Check in at the registration desk on the ground floor. Don't forget to pick up your welcome kit!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
