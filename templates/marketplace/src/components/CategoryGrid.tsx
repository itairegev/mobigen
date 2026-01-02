import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import type { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
  testID?: string;
}

export function CategoryGrid({ categories, testID }: CategoryGridProps) {
  const router = useRouter();

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      smartphone: Icons.Smartphone,
      sofa: Icons.Sofa,
      shirt: Icons.Shirt,
      bike: Icons.Bike,
      home: Icons.Home,
      'gamepad-2': Icons.Gamepad2,
      book: Icons.Book,
      package: Icons.Package,
    };

    const Icon = iconMap[iconName] || Icons.Package;
    return Icon;
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const Icon = getIcon(item.icon);

    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 shadow-sm items-center justify-center"
        style={{ backgroundColor: item.color + '10' }}
        onPress={() => router.push(`/(tabs)/categories?category=${item.id}`)}
        testID={`category-${item.id}`}
      >
        <View
          className="w-12 h-12 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: item.color }}
        >
          <Icon size={24} color="white" />
        </View>
        <Text className="text-sm font-semibold text-gray-900 text-center" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          {item.listingCount} {item.listingCount === 1 ? 'item' : 'items'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={categories}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={renderCategory}
      columnWrapperClassName="gap-3"
      contentContainerClassName="p-4"
      testID={testID}
    />
  );
}
