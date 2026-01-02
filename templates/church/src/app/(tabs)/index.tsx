import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Heart, Users, BookOpen } from 'lucide-react-native';
import { useRecentSermons } from '../../hooks/useSermons';
import { useUpcomingEvents } from '../../hooks/useEvents';
import { SermonCard, EventCard, AnnouncementBanner } from '../../components';
import { getAnnouncements } from '../../services/announcements';
import { useQuery } from '@tanstack/react-query';

export default function HomeScreen() {
  const router = useRouter();
  const { data: recentSermons, isLoading: sermonsLoading } = useRecentSermons(3);
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents(3);
  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: getAnnouncements,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary-600 px-6 py-8">
          <Text className="text-3xl font-bold text-white mb-2">Welcome Home</Text>
          <Text className="text-primary-100 text-base">
            We're glad you're here! Stay connected with our church community.
          </Text>
        </View>

        <View className="px-6 py-6">
          {/* Announcements */}
          {announcements && announcements.length > 0 && (
            <View className="mb-6">
              <Text className="text-2xl font-bold text-gray-900 mb-4">Announcements</Text>
              {announcements.slice(0, 2).map((announcement) => (
                <AnnouncementBanner
                  key={announcement.id}
                  announcement={announcement}
                  onPress={() => {
                    if (announcement.actionUrl) {
                      router.push(announcement.actionUrl as any);
                    }
                  }}
                  testID={`announcement-${announcement.id}`}
                />
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</Text>
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <TouchableOpacity
                  onPress={() => router.push('/prayer')}
                  className="bg-white rounded-xl p-4 shadow-sm items-center"
                  testID="prayer-button"
                >
                  <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-2">
                    <Heart size={24} color="#7c3aed" />
                  </View>
                  <Text className="font-semibold text-gray-900">Prayer</Text>
                  <Text className="text-xs text-gray-500">Requests</Text>
                </TouchableOpacity>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <TouchableOpacity
                  onPress={() => router.push('/groups')}
                  className="bg-white rounded-xl p-4 shadow-sm items-center"
                  testID="groups-button"
                >
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                    <Users size={24} color="#16a34a" />
                  </View>
                  <Text className="font-semibold text-gray-900">Groups</Text>
                  <Text className="text-xs text-gray-500">Connect</Text>
                </TouchableOpacity>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/events')}
                  className="bg-white rounded-xl p-4 shadow-sm items-center"
                  testID="events-button"
                >
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                    <Calendar size={24} color="#2563eb" />
                  </View>
                  <Text className="font-semibold text-gray-900">Events</Text>
                  <Text className="text-xs text-gray-500">Calendar</Text>
                </TouchableOpacity>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/give')}
                  className="bg-white rounded-xl p-4 shadow-sm items-center"
                  testID="give-button"
                >
                  <View className="w-12 h-12 bg-gold-100 rounded-full items-center justify-center mb-2">
                    <BookOpen size={24} color="#f59e0b" />
                  </View>
                  <Text className="font-semibold text-gray-900">Give</Text>
                  <Text className="text-xs text-gray-500">Online</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Recent Sermons */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-900">Recent Sermons</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/sermons')}>
                <Text className="text-primary-600 font-semibold">See All</Text>
              </TouchableOpacity>
            </View>

            {sermonsLoading ? (
              <ActivityIndicator size="large" color="#1e40af" />
            ) : (
              recentSermons?.map((sermon) => (
                <SermonCard
                  key={sermon.id}
                  sermon={sermon}
                  onPress={() => router.push(`/sermons/${sermon.id}` as any)}
                  testID={`sermon-${sermon.id}`}
                />
              ))
            )}
          </View>

          {/* Upcoming Events */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-900">Upcoming Events</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                <Text className="text-primary-600 font-semibold">See All</Text>
              </TouchableOpacity>
            </View>

            {eventsLoading ? (
              <ActivityIndicator size="large" color="#1e40af" />
            ) : (
              upcomingEvents?.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/events/${event.id}` as any)}
                  testID={`event-${event.id}`}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
