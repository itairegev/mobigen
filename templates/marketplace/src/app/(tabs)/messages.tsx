import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useConversations } from '@/hooks';
import { formatDate, formatPrice } from '@/utils';

export default function MessagesScreen() {
  const router = useRouter();
  const { conversations, isLoading } = useConversations();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row"
            onPress={() => router.push(`/messages/${item.id}`)}
            testID={`conversation-${item.id}`}
          >
            <Image
              source={{ uri: item.listing.image }}
              className="w-16 h-16 rounded-lg mr-3"
              resizeMode="cover"
            />

            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-semibold text-gray-900" numberOfLines={1}>
                  {item.otherUser.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatDate(item.lastMessage.timestamp)}
                </Text>
              </View>

              <Text className="text-sm text-gray-600 mb-1" numberOfLines={1}>
                {item.listing.title} • {formatPrice(item.listing.price)}
              </Text>

              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-sm flex-1 ${
                    item.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                  }`}
                  numberOfLines={1}
                >
                  {item.lastMessage.text}
                </Text>

                {item.unreadCount > 0 && (
                  <View className="bg-primary-500 rounded-full w-6 h-6 items-center justify-center ml-2">
                    <Text className="text-white text-xs font-bold">
                      {item.unreadCount > 9 ? '9+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-500">
              {isLoading ? 'Loading conversations...' : 'No messages yet'}
            </Text>
            <Text className="text-gray-400 text-sm mt-2">
              Start chatting with sellers on listings you're interested in
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
