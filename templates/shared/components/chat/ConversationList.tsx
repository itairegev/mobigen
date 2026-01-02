import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';

export interface Conversation {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  online?: boolean;
}

export interface ConversationListProps {
  conversations: Conversation[];
  onConversationPress: (conversation: Conversation) => void;
  testID?: string;
}

export function ConversationList({
  conversations,
  onConversationPress,
  testID,
}: ConversationListProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => onConversationPress(item)}
      className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white active:bg-gray-50"
      testID={`${testID}-conversation-${item.id}`}
    >
      {/* Avatar with online indicator */}
      <View className="mr-3 relative">
        {item.participantAvatar ? (
          <Image
            source={{ uri: item.participantAvatar }}
            className="w-14 h-14 rounded-full"
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center">
            <Text className="text-gray-600 text-lg font-semibold">
              {item.participantName.charAt(0)}
            </Text>
          </View>
        )}
        {item.online && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 mr-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-semibold text-gray-900 flex-1">
            {item.participantName}
          </Text>
          <Text className="text-xs text-gray-500 ml-2">
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text
            className="text-sm text-gray-600 flex-1"
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View className="ml-2 bg-blue-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
              <Text className="text-white text-xs font-semibold">
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={item => item.id}
      className="flex-1 bg-white"
      testID={testID}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-500 text-center">No conversations yet</Text>
        </View>
      }
    />
  );
}
