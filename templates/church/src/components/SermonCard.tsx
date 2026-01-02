import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Calendar, Clock, User } from 'lucide-react-native';
import { Sermon } from '../types';

interface SermonCardProps {
  sermon: Sermon;
  onPress: () => void;
  testID?: string;
}

export function SermonCard({ sermon, onPress, testID }: SermonCardProps) {
  const formattedDate = sermon.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-md mb-4 overflow-hidden"
      testID={testID}
    >
      <Image
        source={{ uri: sermon.thumbnail }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900 mb-2">{sermon.title}</Text>

        <View className="flex-row items-center mb-2">
          <User size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">{sermon.speaker}</Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Calendar size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">{formattedDate}</Text>
        </View>

        <View className="flex-row items-center">
          <Clock size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">{sermon.duration} min</Text>
        </View>

        {sermon.scripture && (
          <View className="mt-3 bg-primary-50 rounded-lg px-3 py-2">
            <Text className="text-sm text-primary-700 font-medium">
              {sermon.scripture}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
