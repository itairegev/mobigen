import { View, Text } from 'react-native';
import type { Message } from '@/types';
import { formatDate } from '@/utils';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  testID?: string;
}

export function ChatBubble({ message, isOwn, testID }: ChatBubbleProps) {
  return (
    <View
      className={`mb-3 ${isOwn ? 'items-end' : 'items-start'}`}
      testID={testID}
    >
      <View
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-primary-500 rounded-tr-sm'
            : 'bg-gray-200 rounded-tl-sm'
        }`}
      >
        <Text className={isOwn ? 'text-white' : 'text-gray-900'}>
          {message.text}
        </Text>
      </View>
      <Text className="text-xs text-gray-500 mt-1 px-1">
        {formatDate(message.timestamp)}
      </Text>
    </View>
  );
}
