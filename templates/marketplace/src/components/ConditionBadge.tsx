import { View, Text } from 'react-native';
import type { ListingCondition } from '@/types';

interface ConditionBadgeProps {
  condition: ListingCondition;
}

export function ConditionBadge({ condition }: ConditionBadgeProps) {
  const badgeStyles = {
    new: { bg: 'bg-green-500', text: 'New' },
    'like-new': { bg: 'bg-teal-500', text: 'Like New' },
    good: { bg: 'bg-blue-500', text: 'Good' },
    fair: { bg: 'bg-yellow-500', text: 'Fair' },
    poor: { bg: 'bg-orange-500', text: 'Poor' },
  };

  const style = badgeStyles[condition];

  return (
    <View className={`${style.bg} px-2 py-1 rounded`}>
      <Text className="text-white text-xs font-semibold">{style.text}</Text>
    </View>
  );
}
