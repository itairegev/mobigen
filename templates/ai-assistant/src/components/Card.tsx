import { View, Text, TouchableOpacity, ViewProps, TouchableOpacityProps } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  onPress?: () => void;
  testID?: string;
}

export function Card({ title, children, onPress, testID }: CardProps) {
  const containerStyle = "bg-white rounded-xl shadow-md p-4 mb-4";
  const content = (
    <>
      {title && (
        <Text className="text-lg font-semibold text-gray-900 mb-2">{title}</Text>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className={containerStyle}
        testID={testID}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View className={containerStyle} testID={testID}>
      {content}
    </View>
  );
}
