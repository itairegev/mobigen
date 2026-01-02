import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useState } from 'react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  onAttachmentPress?: () => void;
  placeholder?: string;
  disabled?: boolean;
  testID?: string;
}

export function ChatInput({
  onSend,
  onAttachmentPress,
  placeholder = 'Type a message...',
  disabled = false,
  testID,
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <View
      className="bg-white border-t border-gray-200 px-4 py-2 flex-row items-end"
      testID={testID}
    >
      {/* Attachment button */}
      {onAttachmentPress && (
        <TouchableOpacity
          onPress={onAttachmentPress}
          disabled={disabled}
          className="mr-2 p-2"
          testID={`${testID}-attachment`}
        >
          <Text className="text-blue-500 text-xl">+</Text>
        </TouchableOpacity>
      )}

      {/* Input field */}
      <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 max-h-24">
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline
          className="text-base text-gray-900"
          editable={!disabled}
          testID={`${testID}-input`}
        />
      </View>

      {/* Send button */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend}
        className={`ml-2 p-2 rounded-full ${
          canSend ? 'bg-blue-500' : 'bg-gray-300'
        }`}
        testID={`${testID}-send`}
      >
        <Text className="text-white text-base px-2">➤</Text>
      </TouchableOpacity>
    </View>
  );
}
