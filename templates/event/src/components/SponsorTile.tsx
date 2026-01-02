import { View, Text, TouchableOpacity, Image } from 'react-native';
import type { Sponsor } from '@/types';

interface SponsorTileProps {
  sponsor: Sponsor;
  onPress?: () => void;
  testID?: string;
}

const tierColors = {
  platinum: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
  gold: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
  silver: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
  bronze: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
};

const tierLabels = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export function SponsorTile({ sponsor, onPress, testID }: SponsorTileProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      className={`rounded-lg p-4 mb-3 border-2 ${tierColors[sponsor.tier]}`}
      testID={testID}
    >
      <View className="items-center mb-3">
        <Image
          source={{ uri: sponsor.logo }}
          className="w-full h-16"
          resizeMode="contain"
        />
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">
          {sponsor.name}
        </Text>
        <View className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {tierLabels[sponsor.tier]}
          </Text>
        </View>
      </View>

      <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2" numberOfLines={2}>
        {sponsor.description}
      </Text>

      {sponsor.booth && (
        <Text className="text-xs text-gray-500 dark:text-gray-500">
          📍 {sponsor.booth}
        </Text>
      )}
    </Wrapper>
  );
}
