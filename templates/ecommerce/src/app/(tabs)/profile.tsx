import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const menuItems = [
    { icon: '📦', title: 'My Orders', route: '/orders' },
    { icon: '❤️', title: 'Favorites', route: '/favorites' },
    { icon: '📍', title: 'Addresses', route: '/addresses' },
    { icon: '💳', title: 'Payment Methods', route: '/payment-methods' },
    { icon: '🔔', title: 'Notifications', route: '/notifications' },
    { icon: '⚙️', title: 'Settings', route: '/settings' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        <View className="bg-white p-6 items-center border-b border-gray-200">
          <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-3">
            <Text className="text-3xl">👤</Text>
          </View>
          <Text className="text-xl font-semibold text-gray-900">Guest User</Text>
          <Text className="text-gray-500">Sign in for a better experience</Text>
        </View>

        <View className="p-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              className="bg-white p-4 rounded-lg mb-2 flex-row items-center"
              onPress={() => router.push(item.route)}
              testID={`menu-${item.title.toLowerCase().replace(/\s/g, '-')}`}
            >
              <Text className="text-2xl mr-4">{item.icon}</Text>
              <Text className="flex-1 text-gray-900 font-medium">{item.title}</Text>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
