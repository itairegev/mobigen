import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { MessageCircle, Send } from 'lucide-react-native';
import { formatRelativeTime } from '../../utils';

// Mock conversations data
const MOCK_CONVERSATIONS = [
  {
    id: '1',
    participant: {
      id: '2',
      name: 'Marcus Chen',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    lastMessage: {
      content: "That's a great idea! Let's discuss it further.",
      createdAt: new Date('2024-01-02T14:30:00'),
    },
    unreadCount: 2,
  },
  {
    id: '2',
    participant: {
      id: '3',
      name: 'Emma Rodriguez',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    lastMessage: {
      content: 'Thanks for the feedback on my design!',
      createdAt: new Date('2024-01-02T10:15:00'),
    },
    unreadCount: 0,
  },
  {
    id: '3',
    participant: {
      id: '8',
      name: 'Ryan Foster',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
    lastMessage: {
      content: 'Looking forward to the podcast recording!',
      createdAt: new Date('2024-01-01T18:45:00'),
    },
    unreadCount: 0,
  },
];

export default function MessagesScreen() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Messages
        </Text>
        <Text className="text-gray-600 dark:text-gray-400">
          Connect with community members
        </Text>
      </View>

      <FlatList
        testID="conversations-list"
        data={MOCK_CONVERSATIONS}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`conversation-${item.id}`}
            className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Image
                source={{ uri: item.participant.avatar }}
                className="w-12 h-12 rounded-full"
              />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {item.participant.name}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(item.lastMessage.createdAt)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-sm ${
                      item.unreadCount > 0
                        ? 'font-medium text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                    numberOfLines={1}
                  >
                    {item.lastMessage.content}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View className="bg-primary-500 w-5 h-5 rounded-full items-center justify-center ml-2">
                      <Text className="text-white text-xs font-bold">
                        {item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="py-16 px-4">
            <MessageCircle
              size={64}
              color="#cbd5e1"
              style={{ alignSelf: 'center', marginBottom: 16 }}
            />
            <Text className="text-center text-gray-500 dark:text-gray-400 text-lg font-medium">
              No messages yet
            </Text>
            <Text className="text-center text-gray-400 dark:text-gray-500 mt-2">
              Start a conversation with a community member
            </Text>
          </View>
        }
      />
    </View>
  );
}
