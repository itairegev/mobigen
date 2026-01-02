import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCategories, useMenuItems } from '@/hooks';
import { MenuItem, MenuCategory } from '@/components';

export default function MenuScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: menuItems, isLoading: loadingItems } = useMenuItems(selectedCategory);

  if (loadingCategories) {
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
      <View className="flex-1">
        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <View className="bg-white border-b border-gray-200">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-4 px-6"
            >
              <MenuCategory
                name="All"
                isActive={selectedCategory === undefined}
                onPress={() => setSelectedCategory(undefined)}
                testID="category-all"
              />
              {categories.map((category) => (
                <MenuCategory
                  key={category.id}
                  name={category.name}
                  isActive={selectedCategory === category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  testID={`category-${category.id}`}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu Items */}
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {loadingItems ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#ff6b35" />
            </View>
          ) : menuItems && menuItems.length > 0 ? (
            <>
              {menuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/menu/${item.id}`)}
                  testID={`menu-item-${item.id}`}
                />
              ))}
              <View className="h-6" />
            </>
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-center">
                No items found in this category
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
