import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, MapPin, CreditCard, Bell, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const menuItems = [
    { icon: User, label: 'Edit Profile', onPress: () => {} },
    { icon: MapPin, label: 'Saved Addresses', onPress: () => {} },
    { icon: CreditCard, label: 'Payment Methods', onPress: () => {} },
    { icon: Bell, label: 'Notifications', onPress: () => {} },
    { icon: HelpCircle, label: 'Help & Support', onPress: () => {} },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white px-6 py-8 mb-4">
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-3">
              <User size={48} color="#ff6b35" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              Guest User
            </Text>
            <Text className="text-gray-600">
              guest@example.com
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-white px-6 py-2 mb-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center justify-between py-4 ${
                index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              testID={`profile-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <View className="flex-row items-center">
                <item.icon size={24} color="#6b7280" />
                <Text className="text-base text-gray-900 ml-3">
                  {item.label}
                </Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View className="bg-white px-6 py-4 mb-4">
          <Text className="text-sm text-gray-500 text-center mb-2">
            Restaurant App
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            Version 1.0.0
          </Text>
        </View>

        {/* Logout Button */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            className="flex-row items-center justify-center py-4 bg-white rounded-xl border border-red-200"
            testID="logout-button"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-500 font-semibold ml-2">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
