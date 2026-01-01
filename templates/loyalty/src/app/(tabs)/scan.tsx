import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'lucide-react-native';

export default function ScanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-64 h-64 border-2 border-white rounded-3xl items-center justify-center mb-8">
          <Camera size={64} color="#ffffff" />
          <Text className="text-white mt-4">Camera Preview</Text>
        </View>

        <Text className="text-white text-xl font-semibold mb-2">
          Scan QR Code
        </Text>
        <Text className="text-gray-400 text-center mb-8">
          Point your camera at the QR code to earn points
        </Text>

        <View className="flex-row gap-4">
          <TouchableOpacity
            className="bg-purple-500 px-6 py-3 rounded-lg"
            testID="enter-code-button"
          >
            <Text className="text-white font-medium">Enter Code</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white/10 px-6 py-3 rounded-lg"
            testID="flash-button"
          >
            <Text className="text-white font-medium">Flash</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
