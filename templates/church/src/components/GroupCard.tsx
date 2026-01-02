import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Calendar, Clock, MapPin, Users } from 'lucide-react-native';
import { Group } from '../types';

interface GroupCardProps {
  group: Group;
  onPress?: () => void;
  testID?: string;
}

export function GroupCard({ group, onPress, testID }: GroupCardProps) {
  const categoryLabels = {
    'bible-study': 'Bible Study',
    prayer: 'Prayer',
    youth: 'Youth',
    men: 'Men',
    women: 'Women',
    couples: 'Couples',
    seniors: 'Seniors',
    'young-adults': 'Young Adults',
    discipleship: 'Discipleship',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="bg-white rounded-xl shadow-md mb-4 overflow-hidden"
      testID={testID}
    >
      {group.image && (
        <Image
          source={{ uri: group.image }}
          className="w-full h-32"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-gray-900 flex-1">{group.name}</Text>
          {!group.isOpen && (
            <View className="bg-red-100 px-2 py-1 rounded-full">
              <Text className="text-xs font-medium text-red-700">Full</Text>
            </View>
          )}
        </View>

        <View className="bg-primary-50 px-2 py-1 rounded-md mb-3 self-start">
          <Text className="text-xs font-medium text-primary-700">
            {categoryLabels[group.category]}
          </Text>
        </View>

        <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
          {group.description}
        </Text>

        <View className="flex-row items-center mb-2">
          <Calendar size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">
            {group.meetingDay}s at {group.meetingTime}
          </Text>
        </View>

        <View className="flex-row items-center mb-2">
          <MapPin size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">{group.location}</Text>
        </View>

        <View className="flex-row items-center">
          <Users size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">
            {group.members} {group.capacity ? `/ ${group.capacity}` : ''} members
          </Text>
        </View>

        <View className="mt-3 pt-3 border-t border-gray-100">
          <Text className="text-xs text-gray-500">Led by {group.leader}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
