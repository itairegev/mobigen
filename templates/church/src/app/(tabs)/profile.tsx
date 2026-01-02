import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Heart, Calendar, Users, Settings, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();

  const menuItems = [
    {
      icon: Heart,
      label: 'My Prayer Requests',
      subtitle: 'View your prayer history',
      onPress: () => router.push('/prayer'),
      testID: 'prayer-requests-button',
    },
    {
      icon: Calendar,
      label: 'My Events',
      subtitle: 'Events you\'re registered for',
      onPress: () => {},
      testID: 'my-events-button',
    },
    {
      icon: Users,
      label: 'My Groups',
      subtitle: 'Small groups you\'re part of',
      onPress: () => router.push('/groups'),
      testID: 'my-groups-button',
    },
    {
      icon: Settings,
      label: 'Settings',
      subtitle: 'App preferences and notifications',
      onPress: () => {},
      testID: 'settings-button',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="bg-primary-600 px-6 py-8 items-center">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4">
            <User size={48} color="#1e40af" />
          </View>
          <Text className="text-2xl font-bold text-white mb-1">John Doe</Text>
          <Text className="text-primary-100">Member since January 2020</Text>
        </View>

        {/* Menu Items */}
        <View className="px-6 py-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                onPress={item.onPress}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
                testID={item.testID}
              >
                <View className="w-12 h-12 bg-primary-50 rounded-full items-center justify-center mr-4">
                  <Icon size={24} color="#1e40af" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">{item.label}</Text>
                  <Text className="text-sm text-gray-500">{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Sign Out */}
          <TouchableOpacity
            className="bg-red-50 rounded-xl p-4 mt-6 flex-row items-center justify-center"
            testID="sign-out-button"
          >
            <LogOut size={20} color="#dc2626" />
            <Text className="text-red-600 font-semibold ml-2">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="px-6 py-4 items-center">
          <Text className="text-xs text-gray-400">Church App v1.0.0</Text>
          <Text className="text-xs text-gray-400 mt-1">Made with Mobigen</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
