import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFeaturedItems, useCategories } from '@/hooks';
import { MenuItem, MenuCategory } from '@/components';
import { Sparkles } from 'lucide-react-native';

export default function HomeScreen() {
  const { data: featuredItems, isLoading: loadingFeatured } = useFeaturedItems();
  const { data: categories, isLoading: loadingCategories } = useCategories();

  if (loadingFeatured || loadingCategories) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff6b35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white px-6 py-6 mb-4">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Welcome! 👋
          </Text>
          <Text className="text-gray-600">
            What are you craving today?
          </Text>
        </View>

        {/* Featured Items */}
        {featuredItems && featuredItems.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center px-6 mb-4">
              <Sparkles size={24} color="#ff6b35" />
              <Text className="text-xl font-bold text-gray-900 ml-2">
                Featured
              </Text>
            </View>

            <View className="px-6">
              {featuredItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/menu/${item.id}`)}
                  testID={`featured-item-${item.id}`}
                />
              ))}
            </View>
          </View>
        )}

        {/* Categories */}
        {categories && categories.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 px-6 mb-4">
              Browse by Category
            </Text>

            <View className="px-6 flex-row flex-wrap gap-3">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => router.push('/menu')}
                  className="flex-1 min-w-[45%] bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  testID={`category-${category.id}`}
                >
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    {category.name}
                  </Text>
                  {category.description && (
                    <Text className="text-sm text-gray-500" numberOfLines={1}>
                      {category.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
