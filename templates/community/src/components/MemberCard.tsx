import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, Calendar } from 'lucide-react-native';
import { Member } from '../types';
import { formatDate } from '../utils';
import { TierBadge } from './TierBadge';

interface MemberCardProps {
  member: Member;
  onPress?: () => void;
  testID?: string;
}

export function MemberCard({ member, onPress, testID }: MemberCardProps) {
  return (
    <TouchableOpacity
      testID={testID}
      className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-3 border border-gray-200 dark:border-slate-700"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <Image
          source={{ uri: member.avatar }}
          className="w-14 h-14 rounded-full"
        />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="font-semibold text-gray-900 dark:text-white">
              {member.name}
            </Text>
            {member.verified && (
              <View className="bg-blue-500 rounded-full w-4 h-4 items-center justify-center">
                <Text className="text-white text-xs">✓</Text>
              </View>
            )}
          </View>

          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {member.username}
          </Text>

          <View className="flex-row items-center gap-2 mb-2">
            <TierBadge tier={member.tier} showLabel />
          </View>

          {member.bio && (
            <Text className="text-sm text-gray-700 dark:text-gray-300 mb-2" numberOfLines={2}>
              {member.bio}
            </Text>
          )}

          <View className="flex-row items-center gap-4">
            {member.location && (
              <View className="flex-row items-center gap-1">
                <MapPin size={12} color="#94a3b8" />
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {member.location}
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#94a3b8" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Joined {formatDate(member.joinedAt, 'MMM yyyy')}
              </Text>
            </View>
          </View>

          {member.badges && member.badges.length > 0 && (
            <View className="flex-row gap-1 mt-2 flex-wrap">
              {member.badges.map((badge) => (
                <View
                  key={badge}
                  className="bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded"
                >
                  <Text className="text-xs text-primary-600 dark:text-primary-400">
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
