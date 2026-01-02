import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Send } from 'lucide-react-native';
import { useConversation, useMessages, useSendMessage } from '@/hooks';
import { ChatBubble } from '@/components';
import { formatPrice } from '@/utils';

export default function ConversationScreen() {
  const params = useLocalSearchParams();
  const { conversation, isLoading } = useConversation(params.id as string);
  const { messages } = useMessages(params.id as string);
  const { sendMessage, isSending } = useSendMessage();
  const [messageText, setMessageText] = useState('');

  const handleSend = async () => {
    if (!messageText.trim() || !conversation) return;

    try {
      await sendMessage({
        conversationId: conversation.id,
        text: messageText.trim(),
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading || !conversation) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        {/* Listing Header */}
        <View className="bg-gray-50 p-3 border-b border-gray-200">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {conversation.listing.title}
          </Text>
          <Text className="text-sm text-gray-600">
            {formatPrice(conversation.listing.price)}
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              isOwn={item.senderId === 'me'}
              testID={`message-${item.id}`}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-gray-500">No messages yet</Text>
              <Text className="text-gray-400 text-sm mt-2">
                Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <View className="border-t border-gray-200 p-3 bg-white flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-900 mr-2"
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            testID="message-input"
          />

          <TouchableOpacity
            className={`w-12 h-12 rounded-full items-center justify-center ${
              messageText.trim() ? 'bg-primary-500' : 'bg-gray-200'
            }`}
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
            testID="send-button"
          >
            <Send
              size={20}
              color={messageText.trim() ? 'white' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
