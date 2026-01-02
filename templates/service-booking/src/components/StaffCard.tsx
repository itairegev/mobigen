import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star, Award } from 'lucide-react-native';
import type { Staff } from '@/types';

interface StaffCardProps {
  staff: Staff;
  onPress: () => void;
  selected?: boolean;
  testID?: string;
}

export function StaffCard({ staff, onPress, selected, testID }: StaffCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-white rounded-xl p-4 mb-3 border-2 ${
        selected ? 'border-primary-500' : 'border-gray-200'
      }`}
      testID={testID}
    >
      <View className="flex-row items-center">
        <Image
          source={{ uri: staff.avatar }}
          className="w-16 h-16 rounded-full"
        />
        <View className="flex-1 ml-4">
          <Text className="text-lg font-semibold text-gray-900">
            {staff.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <Award size={14} color="#9333ea" />
            <Text className="text-sm text-gray-600 ml-1">{staff.title}</Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-sm font-medium text-gray-900 ml-1">
              {staff.rating.toFixed(1)}
            </Text>
            <Text className="text-sm text-gray-500 ml-1">
              ({staff.reviewCount})
            </Text>
          </View>
        </View>
        {selected && (
          <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
            <Text className="text-white text-xs font-bold">✓</Text>
          </View>
        )}
      </View>
      {staff.bio && (
        <Text className="text-sm text-gray-600 mt-3" numberOfLines={2}>
          {staff.bio}
        </Text>
      )}
    </TouchableOpacity>
  );
}
