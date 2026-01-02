import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, MapPin, Users } from 'lucide-react-native';
import type { Session } from '@/types';
import { useAgenda } from '@/hooks/useAgenda';

interface SessionCardProps {
  session: Session;
  onPress: () => void;
  testID?: string;
}

export function SessionCard({ session, onPress, testID }: SessionCardProps) {
  const { isInAgenda } = useAgenda();
  const inAgenda = isInAgenda(session.id);

  const startTime = new Date(session.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = new Date(session.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const capacityPercent = Math.round((session.enrolled / session.capacity) * 100);
  const isFull = capacityPercent >= 100;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 border-l-4 shadow-sm"
      style={{ borderLeftColor: session.trackColor }}
      testID={testID}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: session.trackColor + '20' }}
        >
          <Text className="text-xs font-semibold" style={{ color: session.trackColor }}>
            {session.trackName}
          </Text>
        </View>
        {inAgenda && (
          <View className="bg-accent-500 px-2 py-1 rounded-full">
            <Text className="text-xs text-white font-semibold">In Agenda</Text>
          </View>
        )}
      </View>

      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
        {session.title}
      </Text>

      <Text className="text-sm text-gray-600 dark:text-gray-300 mb-3" numberOfLines={2}>
        {session.description}
      </Text>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center">
          <Clock size={14} color="#64748b" />
          <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
            {startTime} - {endTime}
          </Text>
        </View>

        <View className="flex-row items-center">
          <MapPin size={14} color="#64748b" />
          <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
            {session.room}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Users size={14} color={isFull ? '#ef4444' : '#64748b'} />
          <Text
            className={`text-xs ml-1 ${isFull ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {session.enrolled}/{session.capacity}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 mt-3">
        <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          <Text className="text-xs text-gray-700 dark:text-gray-300 capitalize">
            {session.level}
          </Text>
        </View>
        {session.tags.slice(0, 2).map((tag) => (
          <View key={tag} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            <Text className="text-xs text-gray-700 dark:text-gray-300">{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}
