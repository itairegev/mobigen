import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFavorites, useShoppingList, useMealPlan } from '../../hooks';

export default function ProfileScreen() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const { items } = useShoppingList();
  const { currentWeek } = useMealPlan();

  const stats = [
    {
      icon: 'heart',
      label: 'Favorite Recipes',
      value: favoriteIds.length,
      color: '#FF6B35',
      onPress: () => router.push('/favorites'),
    },
    {
      icon: 'cart',
      label: 'Shopping Items',
      value: items.length,
      color: '#4ECDC4',
      onPress: () => router.push('/(tabs)/shopping'),
    },
    {
      icon: 'calendar',
      label: 'Planned Meals',
      value: currentWeek?.meals.length || 0,
      color: '#FFE66D',
      onPress: () => router.push('/(tabs)/meal-plan'),
    },
  ];

  const menuItems = [
    {
      icon: 'notifications',
      label: 'Notifications',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
    },
    {
      icon: 'settings',
      label: 'Settings',
      onPress: () => Alert.alert('Coming Soon', 'Settings will be available soon'),
    },
    {
      icon: 'share-social',
      label: 'Share App',
      onPress: () => Alert.alert('Share', 'Share this amazing recipe app with friends!'),
    },
    {
      icon: 'help-circle',
      label: 'Help & Support',
      onPress: () => Alert.alert('Help', 'Contact us at support@recipebook.com'),
    },
    {
      icon: 'information-circle',
      label: 'About',
      onPress: () => Alert.alert('RecipeBook', 'Version 1.0.0\n\nYour cooking companion'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="items-center py-8 px-4">
          <View className="w-24 h-24 rounded-full bg-primary-500 items-center justify-center mb-4">
            <Ionicons name="person" size={48} color="white" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Food Lover
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">
            Home Chef
          </Text>
        </View>

        {/* Stats */}
        <View className="px-4 mb-6">
          <View className="flex-row space-x-3">
            {stats.map((stat) => (
              <TouchableOpacity
                key={stat.label}
                onPress={stat.onPress}
                className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 items-center"
                testID={`profile-stat-${stat.label.toLowerCase().replace(' ', '-')}`}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: stat.color }}
                >
                  <Ionicons name={stat.icon as any} size={24} color="white" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {stat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-4 pb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            General
          </Text>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${index === menuItems.length - 1 ? 'rounded-b-xl' : ''} ${
                index !== menuItems.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
              }`}
              testID={`profile-menu-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color="#6B4423"
                  style={{ marginRight: 12 }}
                />
                <Text className="text-base text-gray-900 dark:text-white">
                  {item.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View className="px-4 pb-8 items-center">
          <Text className="text-sm text-gray-400 dark:text-gray-500">
            RecipeBook v1.0.0
          </Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Made with ❤️ for food lovers
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
