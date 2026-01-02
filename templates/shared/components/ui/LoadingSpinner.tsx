import { View, ActivityIndicator, Text } from 'react-native';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  testID?: string;
}

export function LoadingSpinner({
  size = 'large',
  color = '#3b82f6',
  text,
  fullScreen = false,
  testID,
}: LoadingSpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} testID={testID} />
      {text && (
        <Text className="text-gray-600 text-base mt-3">{text}</Text>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        {content}
      </View>
    );
  }

  return (
    <View className="items-center justify-center p-8">
      {content}
    </View>
  );
}
