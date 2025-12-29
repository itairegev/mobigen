import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  User,
  Bell,
  Moon,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingItem({ icon, title, subtitle, onPress, rightElement }: SettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white px-4 py-3 border-b border-gray-100"
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-500">{subtitle}</Text>
        )}
      </View>
      {rightElement || <ChevronRight size={20} color="#9ca3af" />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="bg-white px-4 py-6 items-center border-b border-gray-100">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-3">
            <User size={40} color="#3b82f6" />
          </View>
          <Text className="text-xl font-bold text-gray-900">Reader</Text>
          <Text className="text-sm text-gray-500">Customize your experience</Text>
        </View>

        {/* Preferences */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase px-4 mb-2">
            Preferences
          </Text>
          <SettingItem
            icon={<Bell size={20} color="#3b82f6" />}
            title="Push Notifications"
            subtitle="Breaking news alerts"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={notifications ? '#3b82f6' : '#f4f4f5'}
              />
            }
          />
          <SettingItem
            icon={<Moon size={20} color="#6366f1" />}
            title="Dark Mode"
            subtitle="Reduce eye strain"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={darkMode ? '#3b82f6' : '#f4f4f5'}
              />
            }
          />
        </View>

        {/* Support */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase px-4 mb-2">
            Support
          </Text>
          <SettingItem
            icon={<HelpCircle size={20} color="#10b981" />}
            title="Help & FAQ"
            onPress={() => {}}
          />
          <SettingItem
            icon={<FileText size={20} color="#f59e0b" />}
            title="Terms & Privacy"
            onPress={() => {}}
          />
        </View>

        {/* Logout */}
        <View className="mt-6 mb-8">
          <SettingItem
            icon={<LogOut size={20} color="#ef4444" />}
            title="Sign Out"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
