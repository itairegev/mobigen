import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Briefcase, Mail, Star, MapPin, Award, ExternalLink } from 'lucide-react-native';
import { useAgenda } from '@/hooks/useAgenda';

export default function ProfileScreen() {
  const router = useRouter();
  const { items } = useAgenda();

  // Mock user data
  const user = {
    name: 'Alex Johnson',
    title: 'Senior Product Manager',
    company: 'Tech Innovations Inc.',
    email: 'alex.johnson@example.com',
    avatar: 'https://i.pravatar.cc/400?img=65',
    bio: 'Passionate about building products that make a difference. Always learning and connecting with great people.',
    interests: ['Product Management', 'AI/ML', 'UX Design'],
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView>
        {/* Profile Header */}
        <View className="bg-white dark:bg-gray-800 p-6 mb-4">
          <View className="items-center mb-4">
            <Image
              source={{ uri: user.avatar }}
              className="w-24 h-24 rounded-full mb-3"
              resizeMode="cover"
            />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user.name}
            </Text>
            <View className="flex-row items-center mb-1">
              <Briefcase size={16} color="#64748b" />
              <Text className="text-gray-600 dark:text-gray-400 ml-1">
                {user.title}
              </Text>
            </View>
            <Text className="text-gray-700 dark:text-gray-300 font-medium">
              {user.company}
            </Text>
            <View className="flex-row items-center mt-2">
              <Mail size={16} color="#64748b" />
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                {user.email}
              </Text>
            </View>
          </View>

          <Text className="text-center text-gray-700 dark:text-gray-300 mb-4">
            {user.bio}
          </Text>

          <View className="flex-row flex-wrap gap-2 justify-center">
            {user.interests.map((interest) => (
              <View
                key={interest}
                className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full"
              >
                <Text className="text-sm text-primary-700 dark:text-primary-300">
                  {interest}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            My Stats
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <View className="flex-row items-center mb-2">
                <Star size={20} color="#fb923c" />
                <Text className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {items.length}
                </Text>
              </View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Saved Sessions
              </Text>
            </View>

            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <View className="flex-row items-center mb-2">
                <Award size={20} color="#1e3a8a" />
                <Text className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                  0
                </Text>
              </View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Attended
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Quick Links
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/agenda')}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 flex-row items-center justify-between shadow-sm"
            testID="view-agenda-button"
          >
            <View className="flex-row items-center">
              <Star size={20} color="#fb923c" />
              <Text className="ml-3 text-gray-900 dark:text-white font-semibold">
                My Agenda
              </Text>
            </View>
            <ExternalLink size={16} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/sponsors')}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 flex-row items-center justify-between shadow-sm"
            testID="view-sponsors-button"
          >
            <View className="flex-row items-center">
              <Award size={20} color="#1e3a8a" />
              <Text className="ml-3 text-gray-900 dark:text-white font-semibold">
                Sponsors
              </Text>
            </View>
            <ExternalLink size={16} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/map')}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 flex-row items-center justify-between shadow-sm"
            testID="view-map-button"
          >
            <View className="flex-row items-center">
              <MapPin size={20} color="#1e3a8a" />
              <Text className="ml-3 text-gray-900 dark:text-white font-semibold">
                Venue Map
              </Text>
            </View>
            <ExternalLink size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Event Info */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Event Information
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <Text className="text-gray-900 dark:text-white font-bold mb-2">
              TechConf 2026
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-1">
              📅 March 15-16, 2026
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-1">
              📍 San Francisco Convention Center
            </Text>
            <Text className="text-gray-600 dark:text-gray-400">
              🌐 www.techconf2026.com
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
