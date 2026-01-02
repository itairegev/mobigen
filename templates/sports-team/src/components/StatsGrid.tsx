import { View, Text } from 'react-native';

interface StatItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  testID?: string;
}

export function StatsGrid({ stats, columns = 3, testID }: StatsGridProps) {
  return (
    <View className="bg-white rounded-xl shadow-md p-4" testID={testID}>
      <View className="flex-row flex-wrap -mx-2">
        {stats.map((stat, index) => (
          <View
            key={index}
            className={`px-2 mb-4`}
            style={{ width: `${100 / columns}%` }}
          >
            <View className="items-center">
              <Text
                className={`text-3xl font-bold mb-1 ${
                  stat.highlight ? 'text-team-primary' : 'text-gray-900'
                }`}
              >
                {stat.value}
              </Text>
              <Text className="text-xs text-gray-500 uppercase text-center">
                {stat.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
