import { View, Text, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Search } from 'lucide-react-native';
import { useSpeakers } from '@/hooks/useSpeakers';
import { SpeakerCard } from '@/components';

export default function SpeakersScreen() {
  const router = useRouter();
  const { speakers, isLoading } = useSpeakers();
  const [search, setSearch] = useState('');

  const filteredSpeakers = speakers.filter((speaker) =>
    speaker.name.toLowerCase().includes(search.toLowerCase()) ||
    speaker.company.toLowerCase().includes(search.toLowerCase()) ||
    speaker.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
          <Search size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-gray-900 dark:text-white"
            placeholder="Search speakers..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            testID="search-input"
          />
        </View>
      </View>

      <FlatList
        data={filteredSpeakers}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-4"
        renderItem={({ item }) => (
          <SpeakerCard
            speaker={item}
            onPress={() => router.push(`/speakers/${item.id}`)}
            testID={`speaker-${item.id}`}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-gray-500 dark:text-gray-400">
              {isLoading ? 'Loading speakers...' : 'No speakers found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
