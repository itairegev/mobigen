import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { User, Bell, ShoppingBag, Settings, LogOut, Trophy, Heart } from 'lucide-react-native';

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState({
    gameReminders: true,
    news: true,
    promotions: false,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-team-primary p-6 items-center">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4">
            <User size={48} color="#1e40af" />
          </View>
          <Text className="text-white text-2xl font-bold mb-1">Thunder FC Fan</Text>
          <Text className="text-white/80 text-sm">Member since 2024</Text>
        </View>

        <View className="px-4 py-6">
          {/* Quick Actions */}
          <View className="bg-white rounded-xl shadow-md mb-4 overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-gray-100"
              onPress={() => router.push('/shop')}
              testID="shop-link"
            >
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <ShoppingBag size={20} color="#1e40af" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Team Shop</Text>
                <Text className="text-sm text-gray-500">Browse official merchandise</Text>
              </View>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4"
              testID="favorites-link"
            >
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                <Heart size={20} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Favorite Players</Text>
                <Text className="text-sm text-gray-500">Manage your favorites</Text>
              </View>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>
          </View>

          {/* Notifications Settings */}
          <View className="bg-white rounded-xl shadow-md mb-4 overflow-hidden">
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center mb-1">
                <Bell size={20} color="#1e40af" />
                <Text className="font-bold text-gray-900 ml-2 text-lg">Notifications</Text>
              </View>
            </View>

            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">Game Reminders</Text>
                  <Text className="text-sm text-gray-500">
                    Get notified before games start
                  </Text>
                </View>
                <Switch
                  value={notifications.gameReminders}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, gameReminders: value })
                  }
                  trackColor={{ false: '#d1d5db', true: '#1e40af' }}
                  testID="game-reminders-toggle"
                />
              </View>
            </View>

            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">News Updates</Text>
                  <Text className="text-sm text-gray-500">
                    Latest team news and announcements
                  </Text>
                </View>
                <Switch
                  value={notifications.news}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, news: value })
                  }
                  trackColor={{ false: '#d1d5db', true: '#1e40af' }}
                  testID="news-toggle"
                />
              </View>
            </View>

            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">Promotions</Text>
                  <Text className="text-sm text-gray-500">
                    Special offers and discounts
                  </Text>
                </View>
                <Switch
                  value={notifications.promotions}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, promotions: value })
                  }
                  trackColor={{ false: '#d1d5db', true: '#1e40af' }}
                  testID="promotions-toggle"
                />
              </View>
            </View>
          </View>

          {/* Settings */}
          <View className="bg-white rounded-xl shadow-md mb-4 overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-gray-100"
              testID="settings-link"
            >
              <Settings size={20} color="#6b7280" />
              <Text className="font-semibold text-gray-900 ml-3 flex-1">Settings</Text>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4"
              testID="logout-button"
            >
              <LogOut size={20} color="#ef4444" />
              <Text className="font-semibold text-red-600 ml-3">Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View className="items-center mt-4">
            <Text className="text-gray-400 text-sm">Thunder FC Official App</Text>
            <Text className="text-gray-400 text-xs mt-1">Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
