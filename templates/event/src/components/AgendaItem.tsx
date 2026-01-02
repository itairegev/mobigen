import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, MapPin, Bell, BellOff, Trash2 } from 'lucide-react-native';
import type { Session } from '@/types';
import { useAgenda } from '@/hooks/useAgenda';

interface AgendaItemProps {
  session: Session;
  onPress: () => void;
  testID?: string;
}

export function AgendaItem({ session, onPress, testID }: AgendaItemProps) {
  const { removeFromAgenda, toggleReminder, isInAgenda } = useAgenda();
  const agendaItem = useAgenda((state) =>
    state.items.find((item) => item.sessionId === session.id)
  );

  const startTime = new Date(session.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = new Date(session.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm border-l-4"
      style={{ borderLeftColor: session.trackColor }}
      testID={testID}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View
            className="px-3 py-1 rounded-full mb-2 self-start"
            style={{ backgroundColor: session.trackColor + '20' }}
          >
            <Text className="text-xs font-semibold" style={{ color: session.trackColor }}>
              {session.trackName}
            </Text>
          </View>

          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {session.title}
          </Text>
        </View>

        <View className="flex-row gap-2 ml-2">
          <TouchableOpacity
            onPress={() => toggleReminder(session.id)}
            className="p-2"
          >
            {agendaItem?.reminder ? (
              <Bell size={20} color="#fb923c" />
            ) : (
              <BellOff size={20} color="#94a3b8" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => removeFromAgenda(session.id)}
            className="p-2"
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center">
          <Clock size={14} color="#64748b" />
          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {startTime} - {endTime}
          </Text>
        </View>

        <View className="flex-row items-center">
          <MapPin size={14} color="#64748b" />
          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {session.room}
          </Text>
        </View>
      </View>

      {agendaItem?.notes && (
        <View className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Text className="text-sm text-gray-700 dark:text-gray-300">
            {agendaItem.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
