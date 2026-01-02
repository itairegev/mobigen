import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  testID?: string;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  height = 8,
  color = 'bg-primary-600',
  testID,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <View testID={testID}>
      {(label || showPercentage) && (
        <View className="flex-row items-center justify-between mb-1">
          {label && <Text className="text-sm text-gray-600 dark:text-gray-400">{label}</Text>}
          {showPercentage && (
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </Text>
          )}
        </View>
      )}
      <View
        className="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        style={{ height }}
      >
        <View className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </View>
    </View>
  );
}
