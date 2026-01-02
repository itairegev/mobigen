import { View, Text, ScrollView } from 'react-native';

interface ShowNotesProps {
  content: string;
  testID?: string;
}

export function ShowNotes({ content, testID }: ShowNotesProps) {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-4" testID={testID}>
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Show Notes
      </Text>
      <Text className="text-base text-gray-700 dark:text-gray-300 leading-6 whitespace-pre-line">
        {content}
      </Text>
    </ScrollView>
  );
}
