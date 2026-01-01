import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import { ChatBubble, ChatInput, TypingIndicator, SuggestionCard } from '@/components';
import { useChat, useSuggestions } from '@/hooks';

export default function ChatScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const { currentConversation, isTyping, sendMessage, createConversation } = useChat();
  const { suggestions } = useSuggestions();

  const messages = currentConversation?.messages || [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, isTyping]);

  const handleSuggestion = (prompt: string) => {
    if (!currentConversation) {
      createConversation();
    }
    sendMessage(prompt);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerClassName="p-4"
        >
          {!hasMessages ? (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-4xl mb-4">🤖</Text>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                AI Assistant
              </Text>
              <Text className="text-gray-500 text-center mb-8 px-8">
                Start a conversation or try one of these suggestions
              </Text>

              {/* Suggestions */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4"
              >
                {suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onPress={() => handleSuggestion(suggestion.prompt)}
                    testID={`suggestion-${suggestion.id}`}
                  />
                ))}
              </ScrollView>
            </View>
          ) : (
            <>
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  testID={`message-${message.id}`}
                />
              ))}
              {isTyping && <TypingIndicator testID="typing-indicator" />}
            </>
          )}
        </ScrollView>

        <ChatInput
          onSend={sendMessage}
          disabled={isTyping}
          placeholder="Ask me anything..."
          testID="chat-input"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
