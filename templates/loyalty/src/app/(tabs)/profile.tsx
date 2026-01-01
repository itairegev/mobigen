import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TierBadge } from '@/components';
import { usePoints } from '@/hooks/usePoints';

export default function ProfileScreen() {
  const router = useRouter();
  const { tier } = usePoints();

  const menuItems = [
    { icon: '🎁', title: 'My Rewards', route: '/my-rewards' },
    { icon: '👥', title: 'Refer a Friend', route: '/referral' },
    { icon: '🔔', title: 'Notifications', route: '/notifications' },
    { icon: '📍', title: 'Nearby Locations', route: '/locations' },
    { icon: '❓', title: 'Help & FAQ', route: '/help' },
    { icon: '⚙️', title: 'Settings', route: '/settings' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        <View className="bg-purple-500 p-6 items-center">
          <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-3">
            <Text className="text-3xl">👤</Text>
          </View>
          <Text className="text-xl font-semibold text-white">Guest User</Text>
          <View className="mt-2">
            <TierBadge tier={tier.id} />
          </View>
        </View>

        <View className="p-4">
          <View className="bg-white rounded-xl shadow-sm mb-4 p-4">
            <Text className="text-gray-500 text-sm mb-1">Member since</Text>
            <Text className="text-gray-900 font-medium">January 2024</Text>
          </View>

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
