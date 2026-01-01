import { View, Text, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Settings</Text>

        <View className="space-y-4">
          <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <Text className="text-gray-900">Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              testID="dark-mode-switch"
            />
          </View>

          <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <Text className="text-gray-900">Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              testID="notifications-switch"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
