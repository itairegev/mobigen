import { View, Text, Pressable } from 'react-native';
import type { SuggestedPrompt } from '@/types';

interface SuggestionCardProps {
  suggestion: SuggestedPrompt;
  onPress: () => void;
  testID?: string;
}

export function SuggestionCard({ suggestion, onPress, testID }: SuggestionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-gray-200 rounded-xl p-4 mr-3 w-40"
      testID={testID}
    >
      <Text className="text-2xl mb-2">{suggestion.icon}</Text>
      <Text className="text-sm font-medium text-gray-900 mb-1">
        {suggestion.title}
      </Text>
      <Text className="text-xs text-gray-500" numberOfLines={2}>
        {suggestion.prompt}
      </Text>
    </Pressable>
  );
}
