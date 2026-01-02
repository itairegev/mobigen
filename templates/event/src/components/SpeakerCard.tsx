import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import type { Speaker } from '@/types';

interface SpeakerCardProps {
  speaker: Speaker;
  onPress: () => void;
  testID?: string;
}

export function SpeakerCard({ speaker, onPress, testID }: SpeakerCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm flex-row"
      testID={testID}
    >
      <Image
        source={{ uri: speaker.avatar }}
        className="w-20 h-20 rounded-full"
        resizeMode="cover"
      />

      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {speaker.name}
        </Text>

        <View className="flex-row items-center mb-2">
          <Briefcase size={14} color="#64748b" />
          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {speaker.title}
          </Text>
        </View>

        <Text className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          {speaker.company}
        </Text>

        <Text className="text-xs text-gray-500 dark:text-gray-500 mt-2" numberOfLines={2}>
          {speaker.bio}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
