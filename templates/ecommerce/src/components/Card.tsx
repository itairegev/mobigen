import { View, Text, TouchableOpacity } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  onPress?: () => void;
  testID?: string;
}

export function Card({ title, children, onPress, testID }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      className="bg-white rounded-xl shadow-md p-4 mb-4"
      testID={testID}
    >
      {title && (
        <Text className="text-lg font-semibold text-gray-900 mb-2">{title}</Text>
      )}
      {children}
    </Wrapper>
  );
}
