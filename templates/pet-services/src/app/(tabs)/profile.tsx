import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const menuItems = [
    {
      id: 'account',
      title: 'Account Settings',
      icon: User,
      onPress: () => console.log('Account Settings'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      onPress: () => console.log('Notifications'),
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      icon: CreditCard,
      onPress: () => console.log('Payment Methods'),
    },
    {
      id: 'settings',
      title: 'App Settings',
      icon: Settings,
      onPress: () => console.log('Settings'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: HelpCircle,
      onPress: () => console.log('Help'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="bg-white px-6 py-8 items-center border-b border-gray-200">
          <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
            <Text className="text-5xl">👤</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            Pet Owner
          </Text>
          <Text className="text-gray-600">petowner@example.com</Text>
        </View>

        {/* Menu Items */}
        <View className="px-6 py-4">
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.onPress}
                  className={`flex-row items-center px-4 py-4 ${
                    index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  testID={`menu-${item.id}`}
                >
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                    <Icon size={20} color="#64748b" />
                  </View>
                  <Text className="flex-1 text-base text-gray-900 ml-4">
                    {item.title}
                  </Text>
                  <ChevronRight size={20} color="#cbd5e1" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <View className="px-6 py-4">
          <TouchableOpacity
            onPress={() => console.log('Logout')}
            className="bg-white rounded-xl shadow-sm px-4 py-4 flex-row items-center"
            testID="logout-button"
          >
            <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center">
              <LogOut size={20} color="#ef4444" />
            </View>
            <Text className="flex-1 text-base text-red-600 font-semibold ml-4">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="px-6 py-8 items-center">
          <Text className="text-sm text-gray-400">
            Pet Services App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
