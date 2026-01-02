import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Phone, MapPin, Bell, CreditCard, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const user = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://i.pravatar.cc/150?img=1',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="bg-white px-6 py-8 items-center border-b border-gray-200">
          <Image
            source={{ uri: user.avatar }}
            className="w-24 h-24 rounded-full mb-4"
          />
          <Text className="text-2xl font-bold text-gray-900">{user.name}</Text>
          <Text className="text-gray-600 mt-1">{user.email}</Text>
        </View>

        {/* Profile Information */}
        <View className="bg-white mt-4 px-6 py-2">
          <Text className="text-sm font-semibold text-gray-500 mb-3 uppercase">
            Account Information
          </Text>

          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
              <Mail size={20} color="#0d9488" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-sm text-gray-500">Email</Text>
              <Text className="text-base text-gray-900">{user.email}</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
              <Phone size={20} color="#0d9488" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-sm text-gray-500">Phone</Text>
              <Text className="text-base text-gray-900">{user.phone}</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-4">
            <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
              <MapPin size={20} color="#0d9488" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-sm text-gray-500">Address</Text>
              <Text className="text-base text-gray-900">Add your address</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View className="bg-white mt-4 px-6 py-2">
          <Text className="text-sm font-semibold text-gray-500 mb-3 uppercase">
            Settings
          </Text>

          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
              <Bell size={20} color="#3b82f6" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-base text-gray-900">Notifications</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
              <CreditCard size={20} color="#10b981" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-base text-gray-900">Payment Methods</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-4">
            <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center">
              <HelpCircle size={20} color="#f59e0b" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-base text-gray-900">Help & Support</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View className="px-6 py-6">
          <TouchableOpacity
            className="bg-red-50 rounded-xl py-4 flex-row items-center justify-center"
            testID="logout-button"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-600 font-semibold text-base ml-2">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 pb-6">
          <Text className="text-center text-gray-400 text-sm">
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
