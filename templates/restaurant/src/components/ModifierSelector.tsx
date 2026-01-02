import { View, Text, TouchableOpacity } from 'react-native';
import { ModifierGroup, Modifier, SelectedModifier } from '@/types';
import { formatCurrency } from '@/utils';
import { Check } from 'lucide-react-native';

interface ModifierSelectorProps {
  group: ModifierGroup;
  selectedModifiers: SelectedModifier[];
  onToggleModifier: (modifier: Modifier) => void;
  testID?: string;
}

export function ModifierSelector({
  group,
  selectedModifiers,
  onToggleModifier,
  testID,
}: ModifierSelectorProps) {
  const isSelected = (modifierId: string) =>
    selectedModifiers.some((m) => m.modifierId === modifierId && m.groupId === group.id);

  const selectedCount = selectedModifiers.filter((m) => m.groupId === group.id).length;
  const canSelectMore = selectedCount < group.maxSelections;
  const isValid = selectedCount >= group.minSelections;

  return (
    <View className="mb-6" testID={testID}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-gray-900">
          {group.name}
          {group.required && <Text className="text-red-500"> *</Text>}
        </Text>
        <Text className="text-sm text-gray-500">
          {group.maxSelections === 1
            ? 'Choose 1'
            : `Choose up to ${group.maxSelections}`}
        </Text>
      </View>

      {!isValid && group.required && (
        <Text className="text-red-500 text-sm mb-2">
          Please select at least {group.minSelections} option{group.minSelections > 1 ? 's' : ''}
        </Text>
      )}

      <View className="space-y-2">
        {group.modifiers.map((modifier) => {
          const selected = isSelected(modifier.id);
          const disabled = !selected && !canSelectMore;

          return (
            <TouchableOpacity
              key={modifier.id}
              onPress={() => onToggleModifier(modifier)}
              disabled={disabled}
              className={`flex-row items-center justify-between p-4 rounded-lg border-2 ${
                selected
                  ? 'border-primary-500 bg-primary-50'
                  : disabled
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 bg-white'
              }`}
              testID={`${testID}-${modifier.id}`}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                    selected
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selected && <Check size={16} color="#ffffff" />}
                </View>

                <Text
                  className={`text-base flex-1 ${
                    selected ? 'text-gray-900 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {modifier.name}
                </Text>
              </View>

              {modifier.price > 0 && (
                <Text
                  className={`text-sm font-semibold ${
                    selected ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  +{formatCurrency(modifier.price)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
