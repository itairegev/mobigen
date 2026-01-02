import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Package, Heart, MessageCircle, Settings, LogOut } from 'lucide-react-native';
import { useFavorites, useConversations } from '@/hooks';

// Mock user data
const CURRENT_USER = {
  id: 'me',
  name: 'Alex Thompson',
  email: 'alex@example.com',
  avatar: 'https://i.pravatar.cc/150?img=33',
  location: 'San Francisco, CA',
  joinedDate: new Date('2023-06-15'),
  activeListings: 3,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const { conversations } = useConversations();

  const menuItems = [
    {
      icon: Package,
      label: 'My Listings',
      value: CURRENT_USER.activeListings,
      onPress: () => router.push('/my-listings'),
      testID: 'my-listings-button',
    },
    {
      icon: Heart,
      label: 'Favorites',
      value: favorites.length,
      onPress: () => router.push('/(tabs)/favorites'),
      testID: 'favorites-button',
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      value: conversations.length,
      onPress: () => router.push('/(tabs)/messages'),
      testID: 'messages-button',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Profile Header */}
        <View className="bg-white p-6 items-center border-b border-gray-200">
          <Image source={{ uri: CURRENT_USER.avatar }} className="w-24 h-24 rounded-full mb-4" />
          <Text className="text-2xl font-bold text-gray-900">{CURRENT_USER.name}</Text>
          <Text className="text-gray-600 mt-1">{CURRENT_USER.email}</Text>
          <Text className="text-sm text-gray-500 mt-1">{CURRENT_USER.location}</Text>
          <Text className="text-xs text-gray-400 mt-2">
            Member since {CURRENT_USER.joinedDate.getFullYear()}
          </Text>
        </View>

        {/* Stats Cards */}
        <View className="p-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center justify-between"
              onPress={item.onPress}
              testID={item.testID}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-primary-50 rounded-full items-center justify-center mr-3">
                  <item.icon size={20} color="#14b8a6" />
                </View>
                <Text className="text-base font-medium text-gray-900">{item.label}</Text>
              </View>
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-sm font-semibold text-gray-700">{item.value}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings Section */}
        <View className="p-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Account</Text>

          <TouchableOpacity
            className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
            testID="settings-button"
          >
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <Settings size={20} color="#64748b" />
            </View>
            <Text className="text-base text-gray-900">Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
            testID="logout-button"
          >
            <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mr-3">
              <LogOut size={20} color="#ef4444" />
            </View>
            <Text className="text-base text-red-600">Log Out</Text>
          </TouchableOpacity>
        </View>

        <View className="p-4 items-center">
          <Text className="text-xs text-gray-400">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
