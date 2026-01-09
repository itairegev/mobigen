import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useMenuItem, useCart } from '@/hooks';
import { ModifierSelector } from '@/components';
import { formatCurrency } from '@/utils';
import { SelectedModifier } from '@/types';
import { Minus, Plus } from 'lucide-react-native';

export default function MenuItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useMenuItem(id);
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (isLoading || !item) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff6b35" />
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleModifier = (groupId: string, groupName: string, modifier: any) => {
    const group = item.modifierGroups?.find((g) => g.id === groupId);
    if (!group) return;

    const existingIndex = selectedModifiers.findIndex(
      (m) => m.groupId === groupId && m.modifierId === modifier.id
    );

    if (existingIndex >= 0) {
      // Remove modifier
      setSelectedModifiers(selectedModifiers.filter((_, i) => i !== existingIndex));
    } else {
      // Add modifier
      if (group.maxSelections === 1) {
        // Radio button behavior - replace existing selection
        setSelectedModifiers([
          ...selectedModifiers.filter((m) => m.groupId !== groupId),
          {
            groupId,
            groupName,
            modifierId: modifier.id,
            modifierName: modifier.name,
            price: modifier.price,
          },
        ]);
      } else {
        // Checkbox behavior - add selection
        const groupSelections = selectedModifiers.filter((m) => m.groupId === groupId);
        if (groupSelections.length < group.maxSelections) {
          setSelectedModifiers([
            ...selectedModifiers,
            {
              groupId,
              groupName,
              modifierId: modifier.id,
              modifierName: modifier.name,
              price: modifier.price,
            },
          ]);
        }
      }
    }
  };

  const isValid = () => {
    if (!item.modifierGroups) return true;

    return item.modifierGroups.every((group) => {
      const selections = selectedModifiers.filter((m) => m.groupId === group.id);
      return selections.length >= group.minSelections;
    });
  };

  const calculateTotal = () => {
    const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
    return (item.price + modifierTotal) * quantity;
  };

  const handleAddToCart = () => {
    addItem(item, quantity, selectedModifiers, specialInstructions);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Item Image */}
          <Image
            source={{ uri: item.image }}
            className="w-full h-72"
            resizeMode="cover"
          />

          {/* Item Info */}
          <View className="p-6">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 pr-4">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {item.name}
                </Text>
                <Text className="text-gray-600 text-base">
                  {item.description}
                </Text>
              </View>
              <Text className="text-2xl font-bold text-primary-600">
                {formatCurrency(item.price)}
              </Text>
            </View>

            {/* Dietary Tags */}
            {item.dietaryTags && item.dietaryTags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-4">
                {item.dietaryTags.map((tag) => (
                  <View
                    key={tag}
                    className="bg-green-100 px-3 py-1 rounded-full"
                  >
                    <Text className="text-green-700 text-sm font-medium capitalize">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Prep Time, Calories & Cuisine */}
            <View className="flex-row flex-wrap gap-4 mb-6">
              {item.prepTime && (
                <Text className="text-gray-500 text-sm">
                  🕐 {item.prepTime} min
                </Text>
              )}
              {item.calories && (
                <Text className="text-gray-500 text-sm">
                  🔥 {item.calories} cal
                </Text>
              )}
              {item.area && (
                <Text className="text-gray-500 text-sm">
                  🌍 {item.area} Cuisine
                </Text>
              )}
            </View>

            {/* Ingredients */}
            {item.ingredients && item.ingredients.length > 0 && (
              <View className="mb-6">
                <Text className="text-base font-bold text-gray-900 mb-3">
                  Ingredients
                </Text>
                <View className="bg-gray-50 rounded-lg p-4">
                  {item.ingredients.map((ingredient, index) => (
                    <Text key={index} className="text-gray-700 text-sm mb-1">
                      • {ingredient}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Full Instructions (collapsible) */}
            {item.fullInstructions && (
              <View className="mb-6">
                <Text className="text-base font-bold text-gray-900 mb-3">
                  How It's Made
                </Text>
                <Text className="text-gray-600 text-sm leading-6">
                  {item.fullInstructions}
                </Text>
              </View>
            )}

            {/* Modifiers */}
            {item.modifierGroups && item.modifierGroups.length > 0 && (
              <View className="mb-6">
                {item.modifierGroups.map((group) => (
                  <ModifierSelector
                    key={group.id}
                    group={group}
                    selectedModifiers={selectedModifiers}
                    onToggleModifier={(modifier) =>
                      handleToggleModifier(group.id, group.name, modifier)
                    }
                    testID={`modifier-group-${group.id}`}
                  />
                ))}
              </View>
            )}

            {/* Special Instructions */}
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3">
                Special Instructions
              </Text>
              <TextInput
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                placeholder="Any special requests? (e.g., no onions)"
                multiline
                numberOfLines={3}
                className="bg-gray-50 rounded-lg p-4 text-gray-900 border border-gray-200"
                testID="special-instructions-input"
              />
            </View>

            {/* Quantity Selector */}
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3">
                Quantity
              </Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
                  testID="quantity-decrease"
                >
                  <Minus size={24} color="#374151" />
                </TouchableOpacity>

                <Text className="text-2xl font-bold text-gray-900 mx-8">
                  {quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 bg-primary-500 rounded-full items-center justify-center"
                  testID="quantity-increase"
                >
                  <Plus size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="h-24" />
          </View>
        </ScrollView>

        {/* Add to Cart Button */}
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={!isValid()}
            className={`py-4 rounded-xl ${
              isValid() ? 'bg-primary-500' : 'bg-gray-300'
            }`}
            testID="add-to-cart-button"
          >
            <Text className="text-white font-bold text-center text-base">
              Add to Cart • {formatCurrency(calculateTotal())}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
