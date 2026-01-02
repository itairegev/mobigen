import { View, Text, TouchableOpacity } from 'react-native';
import { Heart, CheckCircle } from 'lucide-react-native';
import { PrayerRequest } from '../types';

interface PrayerCardProps {
  prayer: PrayerRequest;
  onPray?: () => void;
  testID?: string;
}

export function PrayerCard({ prayer, onPray, testID }: PrayerCardProps) {
  const categoryColors = {
    health: 'bg-red-50 text-red-700',
    family: 'bg-blue-50 text-blue-700',
    financial: 'bg-green-50 text-green-700',
    spiritual: 'bg-purple-50 text-purple-700',
    relationships: 'bg-pink-50 text-pink-700',
    guidance: 'bg-indigo-50 text-indigo-700',
    gratitude: 'bg-yellow-50 text-yellow-700',
    other: 'bg-gray-50 text-gray-700',
  };

  const categoryClass = categoryColors[prayer.category] || categoryColors.other;
  const timeAgo = getTimeAgo(prayer.submittedAt);

  return (
    <View
      className="bg-white rounded-xl shadow-md p-4 mb-4"
      testID={testID}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className={`px-3 py-1 rounded-full ${categoryClass}`}>
          <Text className={`text-xs font-medium capitalize ${categoryClass.split(' ')[1]}`}>
            {prayer.category}
          </Text>
        </View>
        {prayer.status === 'answered' && (
          <View className="flex-row items-center">
            <CheckCircle size={16} color="#22c55e" />
            <Text className="text-xs font-medium text-green-600 ml-1">Answered</Text>
          </View>
        )}
      </View>

      <Text className="text-lg font-bold text-gray-900 mb-2">{prayer.title}</Text>
      <Text className="text-sm text-gray-600 mb-3">{prayer.description}</Text>

      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          {prayer.submittedBy} • {timeAgo}
        </Text>

        <TouchableOpacity
          onPress={onPray}
          className="flex-row items-center bg-primary-50 px-3 py-2 rounded-lg"
          testID={`${testID}-pray-button`}
        >
          <Heart size={16} color="#1e40af" />
          <Text className="text-sm font-medium text-primary-700 ml-1">
            Pray ({prayer.prayerCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
