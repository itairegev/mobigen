import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { useAgenda } from '@/hooks/useAgenda';
import { useSessions } from '@/hooks/useSessions';
import { AgendaItem } from '@/components';

export default function AgendaScreen() {
  const router = useRouter();
  const { items } = useAgenda();
  const { sessions } = useSessions();

  const agendaSessions = items
    .map((item) => sessions.find((s) => s.id === item.sessionId))
    .filter((s) => s !== undefined)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {agendaSessions.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Calendar size={64} color="#94a3b8" />
          <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
            Your Agenda is Empty
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center">
            Browse the schedule and add sessions to create your personalized conference agenda
          </Text>
        </View>
      ) : (
        <FlatList
          data={agendaSessions}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4"
          renderItem={({ item }) => (
            <AgendaItem
              session={item}
              onPress={() => router.push(`/sessions/${item.id}`)}
              testID={`agenda-session-${item.id}`}
            />
          )}
          ListHeaderComponent={
            <View className="mb-4">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {agendaSessions.length} session{agendaSessions.length !== 1 ? 's' : ''} in your agenda
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
