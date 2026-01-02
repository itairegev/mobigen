import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEvents } from '../../hooks/useEvents';
import { EventCard } from '../../components';

export default function EventsScreen() {
  const router = useRouter();
  const { data: events, isLoading } = useEvents();

  const now = new Date();
  const upcomingEvents = events?.filter((event) => event.date >= now) || [];
  const pastEvents = events?.filter((event) => event.date < now) || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 py-4">
        {isLoading ? (
          <View className="py-8">
            <ActivityIndicator size="large" color="#1e40af" />
          </View>
        ) : (
          <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <View className="mb-6">
                <Text className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events</Text>
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => router.push(`/events/${event.id}` as any)}
                    testID={`event-${event.id}`}
                  />
                ))}
              </View>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <View className="mb-6">
                <Text className="text-2xl font-bold text-gray-900 mb-4">Past Events</Text>
                {pastEvents.map((event) => (
                  <View key={event.id} className="opacity-60">
                    <EventCard
                      event={event}
                      onPress={() => router.push(`/events/${event.id}` as any)}
                      testID={`event-${event.id}`}
                    />
                  </View>
                ))}
              </View>
            )}

            {events && events.length === 0 && (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-center">
                  No events scheduled at this time.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
