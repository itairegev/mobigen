import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem } from '../../components';
import { useShoppingList } from '../../hooks';

export default function ShoppingScreen() {
  const { items, removeItem, toggleItem, clearChecked, clearAll } = useShoppingList();

  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  const handleClearChecked = () => {
    if (checkedItems.length === 0) return;

    Alert.alert(
      'Clear Checked Items',
      `Remove ${checkedItems.length} checked ${checkedItems.length === 1 ? 'item' : 'items'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: clearChecked, style: 'destructive' },
      ]
    );
  };

  const handleClearAll = () => {
    if (items.length === 0) return;

    Alert.alert(
      'Clear Shopping List',
      'Remove all items from your shopping list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', onPress: clearAll, style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['bottom']}>
      <View className="flex-1">
        {/* Header Actions */}
        {items.length > 0 && (
          <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              {uncheckedItems.length} {uncheckedItems.length === 1 ? 'item' : 'items'} to buy
            </Text>

            <View className="flex-row space-x-2">
              {checkedItems.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearChecked}
                  className="px-3 py-2 bg-secondary-500 rounded-lg"
                  testID="shopping-clear-checked-btn"
                >
                  <Text className="text-white font-semibold text-sm">Clear Checked</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleClearAll}
                className="px-3 py-2 bg-red-500 rounded-lg"
                testID="shopping-clear-all-btn"
              >
                <Ionicons name="trash-outline" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Shopping List */}
        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons name="cart-outline" size={80} color="#CBD5E0" />
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
              Your shopping list is empty
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
              Add ingredients from recipes to start shopping
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Unchecked Items */}
            {uncheckedItems.length > 0 && (
              <View>
                {uncheckedItems.map((item) => (
                  <ShoppingItem
                    key={item.id}
                    item={item}
                    onToggle={() => toggleItem(item.id)}
                    onRemove={() => removeItem(item.id)}
                    testID={`shopping-item-${item.id}`}
                  />
                ))}
              </View>
            )}

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <View>
                <View className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Checked ({checkedItems.length})
                  </Text>
                </View>
                {checkedItems.map((item) => (
                  <ShoppingItem
                    key={item.id}
                    item={item}
                    onToggle={() => toggleItem(item.id)}
                    onRemove={() => removeItem(item.id)}
                    testID={`shopping-item-${item.id}`}
                  />
                ))}
              </View>
            )}

            <View className="h-6" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
