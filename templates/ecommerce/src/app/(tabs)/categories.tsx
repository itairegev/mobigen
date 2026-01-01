import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, isLoading } = useCategories();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white p-4 rounded-lg mb-3 flex-row items-center shadow-sm"
            onPress={() => router.push(`/category/${item.id}`)}
            testID={`category-${item.id}`}
          >
            <Text className="text-3xl mr-4">{item.icon}</Text>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
              <Text className="text-gray-500">{item.productCount} products</Text>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-gray-500">
              {isLoading ? 'Loading...' : 'No categories'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
