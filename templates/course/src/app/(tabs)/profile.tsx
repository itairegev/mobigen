import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Bell, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const menuItems = [
    { icon: Settings, label: 'Account Settings', onPress: () => {} },
    { icon: Bell, label: 'Notifications', onPress: () => {} },
    { icon: HelpCircle, label: 'Help & Support', onPress: () => {} },
    { icon: LogOut, label: 'Log Out', onPress: () => {}, danger: true },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <View className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mb-4">
            <User size={48} color="#6366f1" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            John Doe
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">john.doe@example.com</Text>
        </View>

        {/* Menu Items */}
        <View className="p-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className={`flex-row items-center justify-between p-4 mb-2 rounded-xl ${
                item.danger
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-gray-50 dark:bg-slate-800'
              }`}
              testID={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <View className="flex-row items-center">
                <item.icon
                  size={24}
                  color={item.danger ? '#ef4444' : '#6366f1'}
                />
                <Text
                  className={`text-base font-semibold ml-3 ${
                    item.danger
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {item.label}
                </Text>
              </View>
              <ChevronRight
                size={20}
                color={item.danger ? '#ef4444' : '#94a3b8'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View className="p-6 items-center">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Course App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
