import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Your App
        </Text>
        <Text className="text-gray-600 text-center mb-8">
          Built with Mobigen - React Native + Expo
        </Text>
        <Button
          title="Get Started"
          onPress={() => console.log('Get Started pressed')}
          testID="get-started-button"
        />
      </View>
    </SafeAreaView>
  );
}
