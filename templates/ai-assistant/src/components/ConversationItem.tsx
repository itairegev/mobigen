import { View, Text, Pressable } from 'react-native';
import { MessageSquare, Trash2 } from 'lucide-react-native';
import type { Conversation } from '@/types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
  testID?: string;
}

export function ConversationItem({
  conversation,
  isActive,
  onPress,
  onDelete,
  testID,
}: ConversationItemProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const messageCount = conversation.messages.length;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 border-b border-gray-100 ${
        isActive ? 'bg-blue-50' : 'bg-white'
      }`}
      testID={testID}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          isActive ? 'bg-blue-500' : 'bg-gray-100'
        }`}
      >
        <MessageSquare size={20} color={isActive ? 'white' : '#6b7280'} />
      </View>

      <View className="flex-1">
        <Text
          className={`text-base font-medium ${
            isActive ? 'text-blue-600' : 'text-gray-900'
          }`}
          numberOfLines={1}
        >
          {conversation.title}
        </Text>
        {lastMessage && (
          <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
            {lastMessage.content}
          </Text>
        )}
        <Text className="text-xs text-gray-400 mt-1">
          {messageCount} {messageCount === 1 ? 'message' : 'messages'}
        </Text>
      </View>

      <Pressable
        onPress={onDelete}
        className="p-2"
        testID={`${testID}-delete`}
      >
        <Trash2 size={18} color="#ef4444" />
      </Pressable>
    </Pressable>
  );
}
