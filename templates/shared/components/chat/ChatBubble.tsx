import { View, Text, Image } from 'react-native';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  text: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name?: string;
}

export interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  testID?: string;
}

export function ChatBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  testID,
}: ChatBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View
      className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
      testID={testID}
    >
      {/* Avatar (for received messages) */}
      {!isOwn && showAvatar && (
        <View className="mr-2">
          {message.senderAvatar ? (
            <Image
              source={{ uri: message.senderAvatar }}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center">
              <Text className="text-gray-600 text-xs">
                {message.senderName?.charAt(0) || '?'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for received messages) */}
        {!isOwn && message.senderName && (
          <Text className="text-xs text-gray-500 mb-1 px-3">
            {message.senderName}
          </Text>
        )}

        {/* Message bubble */}
        <View
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-blue-500 rounded-br-sm'
              : 'bg-gray-200 rounded-bl-sm'
          }`}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <View className="mb-2">
              {message.attachments.map(attachment => (
                <View key={attachment.id} className="mb-1">
                  {attachment.type === 'image' ? (
                    <Image
                      source={{ uri: attachment.url }}
                      className="w-48 h-48 rounded-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="bg-white/20 rounded-lg p-2">
                      <Text
                        className={`text-sm ${
                          isOwn ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        📎 {attachment.name || 'File'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Message text */}
          <Text
            className={`text-base ${isOwn ? 'text-white' : 'text-gray-900'}`}
          >
            {message.text}
          </Text>
        </View>

        {/* Timestamp and status */}
        {showTimestamp && (
          <View className="flex-row items-center mt-1 px-2">
            <Text className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </Text>
            {isOwn && message.status && (
              <Text className="text-xs text-gray-500 ml-1">
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'read' && '✓✓'}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
