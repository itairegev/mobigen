import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import type { Attendee } from '@/types';

interface AttendeeCardProps {
  attendee: Attendee;
  onPress?: () => void;
  testID?: string;
}

export function AttendeeCard({ attendee, onPress, testID }: AttendeeCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm"
      testID={testID}
    >
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: attendee.avatar }}
          className="w-16 h-16 rounded-full"
          resizeMode="cover"
        />

        <View className="flex-1 ml-3">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {attendee.name}
          </Text>

          <View className="flex-row items-center">
            <Briefcase size={14} color="#64748b" />
            <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
              {attendee.title}
            </Text>
          </View>

          <Text className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-1">
            {attendee.company}
          </Text>
        </View>
      </View>

      {attendee.interests && attendee.interests.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {attendee.interests.map((interest) => (
            <View
              key={interest}
              className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full"
            >
              <Text className="text-xs text-primary-700 dark:text-primary-300">
                {interest}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Wrapper>
  );
}
