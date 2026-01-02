import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { User, Settings, Download, Bell, Moon, HelpCircle, LogOut } from 'lucide-react-native';
import { usePlayer } from '../../hooks';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const { settings, setSpeed } = usePlayer();

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      {/* Profile Header */}
      <View className="p-6 bg-primary-500">
        <View className="flex-row items-center">
          <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
            <User size={40} color="white" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-2xl font-bold text-white">Guest User</Text>
            <Text className="text-primary-100 mt-1">Free Plan</Text>
          </View>
        </View>

        <TouchableOpacity className="mt-4 bg-white/20 rounded-lg py-3">
          <Text className="text-white font-semibold text-center">
            Upgrade to Premium
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings Sections */}
      <View className="p-4">
        {/* Playback Settings */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Playback
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white">Playback Speed</Text>
              <Text className="text-primary-500 font-medium">{settings.speed}x</Text>
            </View>

            <View className="flex-row items-center justify-between p-4">
              <Text className="text-gray-900 dark:text-white">Auto Download</Text>
              <Switch
                value={autoDownload}
                onValueChange={setAutoDownload}
                trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                testID="auto-download-switch"
              />
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Notifications
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Bell size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white ml-3">
                  Push Notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                testID="notifications-switch"
              />
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Appearance
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Moon size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white ml-3">Dark Mode</Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                testID="dark-mode-switch"
              />
            </View>
          </View>
        </View>

        {/* Other */}
        <View>
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Other
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
              testID="downloads-button"
            >
              <View className="flex-row items-center">
                <Download size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white ml-3">Downloads</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
              testID="settings-button"
            >
              <View className="flex-row items-center">
                <Settings size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white ml-3">Settings</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
              testID="help-button"
            >
              <View className="flex-row items-center">
                <HelpCircle size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white ml-3">Help & Support</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4" testID="logout-button">
              <View className="flex-row items-center">
                <LogOut size={20} color="#ef4444" />
                <Text className="text-red-500 ml-3">Log Out</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View className="mt-8 items-center pb-8">
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            Podcast App v1.0.0
          </Text>
          <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Made with Mobigen
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
