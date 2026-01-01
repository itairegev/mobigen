import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { ConversationItem } from '@/components';
import { useChat } from '@/hooks';

export default function HistoryScreen() {
  const router = useRouter();
  const {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    deleteConversation,
    clearAllConversations,
  } = useChat();

  const handleNewChat = () => {
    createConversation();
    router.push('/');
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    router.push('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      {/* Header Actions */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={handleNewChat}
          className="flex-row items-center bg-blue-500 px-4 py-2 rounded-full"
          testID="new-chat-button"
        >
          <Plus size={18} color="white" />
          <Text className="text-white font-medium ml-1">New Chat</Text>
        </Pressable>

        {conversations.length > 0 && (
          <Pressable
            onPress={clearAllConversations}
            className="flex-row items-center px-3 py-2"
            testID="clear-all-button"
          >
            <Trash2 size={18} color="#ef4444" />
            <Text className="text-red-500 font-medium ml-1">Clear All</Text>
          </Pressable>
        )}
      </View>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-4xl mb-4">💬</Text>
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            No conversations yet
          </Text>
          <Text className="text-gray-500 text-center">
            Start a new chat to begin a conversation with the AI assistant.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === currentConversation?.id}
              onPress={() => handleSelectConversation(conversation.id)}
              onDelete={() => deleteConversation(conversation.id)}
              testID={`conversation-${conversation.id}`}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
