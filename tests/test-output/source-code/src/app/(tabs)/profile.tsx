import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  Moon,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Bookmark,
} from 'lucide-react-native';
import { usePreferencesStore, useThemeStore, useBookmarkStore } from '@/stores';

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
  const { notificationsEnabled, updatePreferences } = usePreferencesStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { bookmarks } = useBookmarkStore();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="bg-white px-4 py-6 items-center border-b border-gray-100">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-3">
            <User size={40} color="#2563eb" />
          </View>
          <Text className="text-xl font-bold text-gray-900">Tech Reader</Text>
          <Text className="text-sm text-gray-500">Stay updated with tech news</Text>
        </View>

        {/* Stats */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center justify-center">
            <View className="items-center">
              <Bookmark size={24} color="#2563eb" />
              <Text className="text-2xl font-bold text-gray-900 mt-1">{bookmarks.length}</Text>
              <Text className="text-sm text-gray-500">Saved Articles</Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase px-4 mb-2">
            Preferences
          </Text>
          <SettingItem
            icon={<Bell size={20} color="#2563eb" />}
            title="Push Notifications"
            subtitle="Breaking tech news alerts"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => updatePreferences({ notificationsEnabled: value })}
                trackColor={{ false: '#d1d5db', true: '#bfdbfe' }}
                thumbColor={notificationsEnabled ? '#2563eb' : '#f4f4f5'}
              />
            }
          />
          <SettingItem
            icon={<Moon size={20} color="#059669" />}
            title="Dark Mode"
            subtitle="Reduce eye strain while reading"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d1d5db', true: '#bfdbfe' }}
                thumbColor={isDarkMode ? '#2563eb' : '#f4f4f5'}
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
            icon={<HelpCircle size={20} color="#059669" />}
            title="Help & FAQ"
            subtitle="Get help with TechNews Daily"
            onPress={() => {}}
          />
          <SettingItem
            icon={<FileText size={20} color="#f59e0b" />}
            title="Terms & Privacy"
            subtitle="Review our policies"
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
