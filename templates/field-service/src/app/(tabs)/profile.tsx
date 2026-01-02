import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  Bell,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const technician = {
    name: 'John Technician',
    email: 'john@fieldservice.com',
    phone: '(555) 123-4567',
    employeeId: 'TECH-001',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="bg-white px-6 py-6 mb-4">
          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="w-20 h-20 rounded-full bg-blue-500 items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {technician.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </Text>
            </View>

            {/* Info */}
            <View className="flex-1 ml-4">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {technician.name}
              </Text>
              <Text className="text-sm text-gray-600 mb-0.5">
                {technician.email}
              </Text>
              <Text className="text-xs text-gray-500">
                ID: {technician.employeeId}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View className="px-6">
          {/* Account Settings */}
          <View className="bg-white rounded-lg mb-4 overflow-hidden">
            <Text className="text-xs font-semibold text-gray-500 px-4 pt-4 pb-2">
              ACCOUNT
            </Text>
            <MenuItem
              icon={<User size={20} color="#6b7280" />}
              title="Edit Profile"
              onPress={() => {}}
              testID="edit-profile"
            />
            <MenuItem
              icon={<Settings size={20} color="#6b7280" />}
              title="Settings"
              onPress={() => {}}
              testID="settings"
            />
            <MenuItem
              icon={<Bell size={20} color="#6b7280" />}
              title="Notifications"
              onPress={() => {}}
              testID="notifications"
            />
          </View>

          {/* Support */}
          <View className="bg-white rounded-lg mb-4 overflow-hidden">
            <Text className="text-xs font-semibold text-gray-500 px-4 pt-4 pb-2">
              SUPPORT
            </Text>
            <MenuItem
              icon={<HelpCircle size={20} color="#6b7280" />}
              title="Help Center"
              onPress={() => {}}
              testID="help"
            />
            <MenuItem
              icon={<FileText size={20} color="#6b7280" />}
              title="Terms & Privacy"
              onPress={() => {}}
              testID="terms"
            />
          </View>

          {/* Logout */}
          <View className="bg-white rounded-lg mb-4">
            <MenuItem
              icon={<LogOut size={20} color="#ef4444" />}
              title="Logout"
              onPress={() => {}}
              titleClassName="text-red-600"
              testID="logout"
            />
          </View>

          {/* Version */}
          <Text className="text-center text-xs text-gray-400 mb-4">
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  titleClassName?: string;
  testID?: string;
}

function MenuItem({ icon, title, onPress, titleClassName, testID }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-4 border-b border-gray-100"
      testID={testID}
    >
      <View className="w-10">{icon}</View>
      <Text className={`flex-1 text-base ${titleClassName || 'text-gray-900'}`}>
        {title}
      </Text>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
}
