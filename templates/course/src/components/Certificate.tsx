import { View, Text } from 'react-native';
import { Award } from 'lucide-react-native';

interface CertificateProps {
  courseName: string;
  completedAt: Date;
  testID?: string;
}

export function Certificate({ courseName, completedAt, testID }: CertificateProps) {
  return (
    <View
      className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-6 rounded-xl border-2 border-primary-300 dark:border-primary-700"
      testID={testID}
    >
      <View className="items-center">
        <Award size={48} color="#6366f1" />
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4 text-center">
          Certificate of Completion
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-400 mt-2 text-center">
          This certifies that you have successfully completed
        </Text>
        <Text className="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-3 text-center">
          {courseName}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Completed on {completedAt.toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}
