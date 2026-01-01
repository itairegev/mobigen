import { View, Text } from 'react-native';

interface TierBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  size?: 'sm' | 'md';
}

const tierConfig = {
  bronze: { bg: 'bg-amber-700', text: 'Bronze', icon: '🥉' },
  silver: { bg: 'bg-gray-400', text: 'Silver', icon: '🥈' },
  gold: { bg: 'bg-yellow-500', text: 'Gold', icon: '🥇' },
  platinum: { bg: 'bg-purple-300', text: 'Platinum', icon: '💎' },
};

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const config = tierConfig[tier];
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View className={`${config.bg} ${padding} rounded-full flex-row items-center`}>
      <Text className="mr-1">{config.icon}</Text>
      <Text className={`text-white font-medium ${textSize}`}>{config.text}</Text>
    </View>
  );
}
