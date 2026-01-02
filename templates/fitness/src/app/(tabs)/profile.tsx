import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '@/components';

export default function ProfileScreen() {
  const menuItems = [
    {
      icon: User,
      label: 'Edit Profile',
      onPress: () => console.log('Edit Profile'),
      testID: 'profile-edit',
    },
    {
      icon: CreditCard,
      label: 'Membership',
      onPress: () => console.log('Membership'),
      testID: 'profile-membership',
    },
    {
      icon: Bell,
      label: 'Notifications',
      onPress: () => console.log('Notifications'),
      testID: 'profile-notifications',
    },
    {
      icon: Lock,
      label: 'Privacy & Security',
      onPress: () => console.log('Privacy'),
      testID: 'profile-privacy',
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      onPress: () => console.log('Help'),
      testID: 'profile-help',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Profile Header */}
          <Card className="p-6 mb-6">
            <View className="items-center">
              <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-4">
                <User size={48} color="#10b981" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">John Doe</Text>
              <Text className="text-gray-600 mt-1">Member since Jan 2024</Text>

              <View className="flex-row items-center mt-4 bg-primary-50 rounded-full px-4 py-2">
                <Text className="text-primary-700 font-semibold">Premium Member</Text>
              </View>
            </View>
          </Card>

          {/* Contact Info */}
          <Card className="p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Contact Info</Text>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <Mail size={20} color="#6b7280" />
              <Text className="text-gray-700 ml-3">john.doe@example.com</Text>
            </View>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <Phone size={20} color="#6b7280" />
              <Text className="text-gray-700 ml-3">+1 (555) 123-4567</Text>
            </View>

            <View className="flex-row items-center py-3">
              <MapPin size={20} color="#6b7280" />
              <Text className="text-gray-700 ml-3">New York, NY</Text>
            </View>
          </Card>

          {/* Settings Menu */}
          <Card className="mb-6">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                className={`flex-row items-center justify-between p-4 ${
                  index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                testID={item.testID}
              >
                <View className="flex-row items-center">
                  <item.icon size={20} color="#6b7280" />
                  <Text className="text-gray-900 ml-3 text-base">{item.label}</Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </Card>

          {/* Logout Button */}
          <TouchableOpacity
            className="bg-red-50 rounded-xl p-4 flex-row items-center justify-center"
            onPress={() => console.log('Logout')}
            testID="profile-logout"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-600 font-semibold ml-2">Log Out</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text className="text-center text-gray-500 text-sm mt-6 mb-4">
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
