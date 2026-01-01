import { View, Text } from 'react-native';
import type { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
  testID?: string;
}

export function ChatBubble({ message, testID }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View
      className={`max-w-[85%] mb-3 ${isUser ? 'self-end' : 'self-start'}`}
      testID={testID}
    >
      <View
        className={`px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-blue-500 rounded-br-sm'
            : 'bg-gray-100 rounded-bl-sm'
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            isUser ? 'text-white' : 'text-gray-900'
          }`}
        >
          {message.content}
        </Text>
      </View>
      {message.status === 'error' && (
        <Text className="text-xs text-red-500 mt-1 text-right">
          Failed to send
        </Text>
      )}
    </View>
  );
}
