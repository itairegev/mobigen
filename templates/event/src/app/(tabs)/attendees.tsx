import { View, Text, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Search } from 'lucide-react-native';
import { useAttendees } from '@/hooks/useAttendees';
import { AttendeeCard } from '@/components';

export default function AttendeesScreen() {
  const { attendees, isLoading } = useAttendees();
  const [search, setSearch] = useState('');

  const filteredAttendees = attendees.filter((attendee) =>
    attendee.name.toLowerCase().includes(search.toLowerCase()) ||
    attendee.company.toLowerCase().includes(search.toLowerCase()) ||
    attendee.title.toLowerCase().includes(search.toLowerCase()) ||
    attendee.interests.some((interest) =>
      interest.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700 mb-3">
          <Search size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-gray-900 dark:text-white"
            placeholder="Search attendees..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            testID="search-input"
          />
        </View>

        <View className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mb-4">
          <Text className="text-sm text-primary-900 dark:text-primary-100">
            💡 Connect with other attendees! Search by name, company, or interests.
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredAttendees}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-4"
        renderItem={({ item }) => (
          <AttendeeCard attendee={item} testID={`attendee-${item.id}`} />
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-gray-500 dark:text-gray-400">
              {isLoading ? 'Loading attendees...' : 'No attendees found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
