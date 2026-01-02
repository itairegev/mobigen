import { View, Text } from 'react-native';
import { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  testID?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  testID,
}: EmptyStateProps) {
  return (
    <View
      className="flex-1 items-center justify-center px-8 py-12"
      testID={testID}
    >
      {icon && <View className="mb-4">{icon}</View>}

      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
        {title}
      </Text>

      {description && (
        <Text className="text-base text-gray-500 text-center mb-6 max-w-sm">
          {description}
        </Text>
      )}

      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
