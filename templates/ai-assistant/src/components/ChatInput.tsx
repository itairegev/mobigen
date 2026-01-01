import { View, TextInput, Pressable } from 'react-native';
import { useState, useRef } from 'react';
import { Send, Mic } from 'lucide-react-native';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  testID?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Message...',
  testID,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setText('');
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View
      className="flex-row items-end px-4 py-2 bg-white border-t border-gray-100"
      testID={testID}
    >
      <View className="flex-1 flex-row items-end bg-gray-100 rounded-3xl px-4 py-2 mr-2">
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={4000}
          editable={!disabled}
          className="flex-1 text-base text-gray-900 max-h-32 py-1"
          testID={`${testID}-input`}
        />
      </View>

      {canSend ? (
        <Pressable
          onPress={handleSend}
          className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
          testID={`${testID}-send`}
        >
          <Send size={20} color="white" />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => {}}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          testID={`${testID}-voice`}
        >
          <Mic size={20} color="#6b7280" />
        </Pressable>
      )}
    </View>
  );
}
