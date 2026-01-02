import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare } from 'lucide-react-native';
import { useClients } from '@/hooks';
import { getInitials, formatRelativeTime } from '@/utils';

export default function MessagesScreen() {
  const { conversations, loading, refresh } = useClients();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        <View className="px-6 py-4">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                testID={`conversation-${conversation.id}`}
              />
            ))
          ) : (
            <View className="bg-white rounded-lg p-8 items-center">
              <MessageSquare size={48} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-3">
                No messages yet
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Client messages will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ConversationCardProps {
  conversation: {
    id: string;
    clientName: string;
    clientAvatar?: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    jobId?: string;
  };
  testID?: string;
}

function ConversationCard({ conversation, testID }: ConversationCardProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
      testID={testID}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
          <Text className="text-blue-700 font-semibold text-lg">
            {getInitials(conversation.clientName)}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900">
              {conversation.clientName}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatRelativeTime(conversation.lastMessageTime)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text
              className={`text-sm flex-1 ${
                conversation.unreadCount > 0
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-600'
              }`}
              numberOfLines={1}
            >
              {conversation.lastMessage}
            </Text>

            {conversation.unreadCount > 0 && (
              <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">
                  {conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {conversation.jobId && (
            <Text className="text-xs text-gray-500 mt-1">
              Related to Job #{conversation.jobId}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
