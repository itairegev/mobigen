import { View, Text } from 'react-native';
import { Crown, Star, Heart, CircleDot } from 'lucide-react-native';
import { MembershipTier } from '../types';
import { getTierColor, getTierLabel } from '../utils';

interface TierBadgeProps {
  tier: MembershipTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  testID?: string;
}

export function TierBadge({ tier, size = 'md', showLabel = false, testID }: TierBadgeProps) {
  const icons = {
    vip: Crown,
    premium: Star,
    supporter: Heart,
    free: CircleDot,
  };

  const sizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const Icon = icons[tier];
  const color = getTierColor(tier);
  const iconSize = sizes[size];

  if (tier === 'free' && !showLabel) {
    return null; // Don't show badge for free tier unless label is explicitly requested
  }

  return (
    <View
      testID={testID}
      className={`flex-row items-center gap-1 ${
        showLabel ? 'bg-opacity-10 px-2 py-1 rounded-full' : ''
      }`}
      style={showLabel ? { backgroundColor: `${color}20` } : undefined}
    >
      <Icon size={iconSize} color={color} />
      {showLabel && (
        <Text
          className="text-xs font-medium"
          style={{ color }}
        >
          {getTierLabel(tier)}
        </Text>
      )}
    </View>
  );
}
