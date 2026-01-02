import { View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Send } from 'lucide-react-native';
import { useState } from 'react';

// Mock conversation data
const MOCK_MESSAGES = [
  {
    id: '1',
    senderId: '2',
    content: 'Hey! How are you doing?',
    createdAt: new Date('2024-01-02T10:00:00'),
  },
  {
    id: '2',
    senderId: '1',
    content: "I'm great, thanks! Working on some exciting projects.",
    createdAt: new Date('2024-01-02T10:05:00'),
  },
  {
    id: '3',
    senderId: '2',
    content: "That's awesome! I'd love to hear more about them.",
    createdAt: new Date('2024-01-02T10:10:00'),
  },
  {
    id: '4',
    senderId: '1',
    content: "Sure! Let's schedule a call sometime this week.",
    createdAt: new Date('2024-01-02T10:15:00'),
  },
];

const CURRENT_USER_ID = '1';

export default function ConversationScreen() {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={MOCK_MESSAGES}
        renderItem={({ item }) => {
          const isOwn = item.senderId === CURRENT_USER_ID;
          return (
            <View
              className={`px-4 py-2 ${isOwn ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-primary-500'
                    : 'bg-white dark:bg-slate-800'
                }`}
              >
                <Text
                  className={`text-base ${
                    isOwn ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {item.content}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerClassName="py-4"
        inverted={false}
      />

      {/* Message Input */}
      <View className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4">
        <View className="flex-row items-center gap-2">
          <TextInput
            testID="message-input"
            className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full px-4 py-3 text-gray-900 dark:text-white"
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            testID="send-button"
            className={`w-12 h-12 rounded-full items-center justify-center ${
              message.trim()
                ? 'bg-primary-500'
                : 'bg-gray-300 dark:bg-slate-700'
            }`}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Send size={20} color={message.trim() ? '#ffffff' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
