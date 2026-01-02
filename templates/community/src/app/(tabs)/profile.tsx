import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import {
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  Crown,
  Calendar,
  MessageCircle,
} from 'lucide-react-native';
import { TierBadge } from '../../components';
import { formatDate } from '../../utils';

// Mock current user
const CURRENT_USER = {
  id: '1',
  name: 'Sarah Johnson',
  username: '@sarahj',
  avatar: 'https://i.pravatar.cc/150?img=1',
  bio: 'Community builder & creative entrepreneur. Passionate about connection.',
  tier: 'vip' as const,
  joinedAt: new Date('2023-01-15'),
  location: 'San Francisco, CA',
  stats: {
    posts: 127,
    followers: 1243,
    following: 456,
  },
};

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-slate-900">
      {/* Profile Header */}
      <View className="bg-white dark:bg-slate-800 p-6 border-b border-gray-200 dark:border-slate-700">
        <View className="items-center mb-4">
          <Image
            source={{ uri: CURRENT_USER.avatar }}
            className="w-24 h-24 rounded-full mb-3"
          />
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {CURRENT_USER.name}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mb-2">
            {CURRENT_USER.username}
          </Text>
          <TierBadge tier={CURRENT_USER.tier} size="lg" showLabel />
        </View>

        {CURRENT_USER.bio && (
          <Text className="text-center text-gray-700 dark:text-gray-300 mb-4">
            {CURRENT_USER.bio}
          </Text>
        )}

        {/* Stats */}
        <View className="flex-row justify-around pt-4 border-t border-gray-100 dark:border-slate-700">
          <View className="items-center">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {CURRENT_USER.stats.posts}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Posts</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {CURRENT_USER.stats.followers}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Followers</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {CURRENT_USER.stats.following}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Following</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-center gap-1 mt-4">
          <Calendar size={14} color="#94a3b8" />
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Joined {formatDate(CURRENT_USER.joinedAt, 'MMMM yyyy')}
          </Text>
        </View>
      </View>

      {/* Membership Section */}
      <View className="bg-white dark:bg-slate-800 mt-4 p-4 border-b border-gray-200 dark:border-slate-700">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Membership
        </Text>
        <TouchableOpacity
          className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg p-4"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-bold text-lg mb-1">VIP Member</Text>
              <Text className="text-white/80 text-sm">
                Access to all exclusive content and events
              </Text>
            </View>
            <Crown size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View className="bg-white dark:bg-slate-800 mt-4">
        <MenuItem
          icon={Settings}
          label="Settings"
          onPress={() => {}}
          testID="settings-button"
        />
        <MenuItem
          icon={Bell}
          label="Notifications"
          onPress={() => {}}
          testID="notifications-button"
        />
        <MenuItem
          icon={MessageCircle}
          label="Support"
          onPress={() => {}}
          testID="support-button"
        />
        <MenuItem
          icon={HelpCircle}
          label="Help & FAQ"
          onPress={() => {}}
          testID="help-button"
        />
      </View>

      {/* Logout */}
      <View className="bg-white dark:bg-slate-800 mt-4">
        <MenuItem
          icon={LogOut}
          label="Log Out"
          onPress={() => {}}
          testID="logout-button"
          danger
        />
      </View>

      <View className="p-4">
        <Text className="text-center text-gray-400 dark:text-gray-500 text-xs">
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

interface MenuItemProps {
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}

function MenuItem({ icon: Icon, label, onPress, danger, testID }: MenuItemProps) {
  return (
    <TouchableOpacity
      testID={testID}
      className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-3">
        <Icon size={20} color={danger ? '#ef4444' : '#64748b'} />
        <Text
          className={`text-base ${
            danger
              ? 'text-red-500'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {label}
        </Text>
      </View>
      <Text className="text-gray-400">›</Text>
    </TouchableOpacity>
  );
}
