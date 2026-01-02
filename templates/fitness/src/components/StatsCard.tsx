import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Card } from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: string;
  testID?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = '#10b981',
  subtitle,
  testID,
}: StatsCardProps) {
  return (
    <Card className="p-4 flex-1 min-w-[140px]" testID={testID}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-gray-600">{title}</Text>
        <Icon size={20} color={iconColor} />
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      {subtitle && <Text className="text-xs text-gray-500">{subtitle}</Text>}
    </Card>
  );
}
