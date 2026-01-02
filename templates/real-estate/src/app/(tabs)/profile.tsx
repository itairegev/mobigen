import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Calendar,
  Heart,
  Calculator,
  Mail,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { Card } from '@/components';
import { useSaved, useTours } from '@/hooks';

export default function ProfileScreen() {
  const router = useRouter();
  const { savedPropertyIds } = useSaved();
  const { tours } = useTours();

  const stats = [
    { label: 'Saved Properties', value: savedPropertyIds.length, icon: Heart },
    { label: 'Scheduled Tours', value: tours.filter(t => t.status === 'pending').length, icon: Calendar },
  ];

  const menuItems = [
    { label: 'Scheduled Tours', icon: Calendar, route: '/schedule-tour' },
    { label: 'Mortgage Calculator', icon: Calculator, route: '/calculator' },
    { label: 'Contact Agent', icon: Mail, route: '/contact' },
    { label: 'Notifications', icon: Bell, route: null },
    { label: 'Settings', icon: Settings, route: null },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Profile Header */}
        <Card className="p-6 mb-4 items-center">
          <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-4">
            <User size={48} color="#16a34a" />
          </View>
          <Text className="text-gray-900 font-bold text-2xl mb-1">Guest User</Text>
          <Text className="text-gray-500 mb-4">guest@example.com</Text>
          <TouchableOpacity className="bg-primary-600 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold">Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          {stats.map((stat, index) => (
            <Card key={index} className="flex-1 p-4">
              <stat.icon size={24} color="#16a34a" />
              <Text className="text-gray-900 font-bold text-2xl mt-2">{stat.value}</Text>
              <Text className="text-gray-600 text-sm">{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Menu Items */}
        <Card className="mb-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center p-4 ${
                index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={() => item.route && router.push(item.route as any)}
              testID={`menu-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon size={20} color="#6b7280" />
              <Text className="text-gray-900 ml-3 flex-1">{item.label}</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout */}
        <TouchableOpacity className="flex-row items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2">Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
