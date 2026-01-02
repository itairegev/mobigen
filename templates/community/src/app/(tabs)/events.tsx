import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Video } from 'lucide-react-native';
import { useUpcomingEvents } from '../../hooks';
import { EventCard } from '../../components';

export default function EventsScreen() {
  const { data: events, isLoading, refetch } = useUpcomingEvents();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upcoming Events
        </Text>
        <Text className="text-gray-600 dark:text-gray-400">
          Join community events and connect with members
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white dark:bg-slate-800 px-4 py-2 border-b border-gray-200 dark:border-slate-700">
        <View className="flex-row gap-2">
          <TouchableOpacity className="bg-primary-500 px-4 py-2 rounded-full">
            <Text className="text-white font-medium text-sm">All Events</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-full">
            <View className="flex-row items-center gap-1">
              <Video size={14} color="#64748b" />
              <Text className="text-gray-700 dark:text-gray-300 text-sm">Virtual</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-full">
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color="#64748b" />
              <Text className="text-gray-700 dark:text-gray-300 text-sm">In-Person</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        testID="events-list"
        data={events || []}
        renderItem={({ item }) => (
          <EventCard event={item} testID={`event-${item.id}`} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="py-12">
            <Calendar size={48} color="#cbd5e1" style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text className="text-center text-gray-500 dark:text-gray-400">
              No upcoming events
            </Text>
            <Text className="text-center text-gray-400 dark:text-gray-500 mt-2">
              Check back soon for new community events
            </Text>
          </View>
        }
      />
    </View>
  );
}
