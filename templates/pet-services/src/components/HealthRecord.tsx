import { View, Text, TouchableOpacity } from 'react-native';
import { HealthRecord as HealthRecordType } from '@/types';
import { format } from 'date-fns';
import { FileText, Syringe, Stethoscope, Activity, Pill } from 'lucide-react-native';

interface HealthRecordProps {
  record: HealthRecordType;
  onPress?: () => void;
  testID?: string;
}

export function HealthRecord({ record, onPress, testID }: HealthRecordProps) {
  const typeIcons = {
    vaccination: Syringe,
    checkup: Stethoscope,
    surgery: Activity,
    medication: Pill,
    other: FileText,
  };

  const typeColors = {
    vaccination: 'bg-blue-100',
    checkup: 'bg-green-100',
    surgery: 'bg-purple-100',
    medication: 'bg-orange-100',
    other: 'bg-gray-100',
  };

  const Icon = typeIcons[record.type];
  const colorClass = typeColors[record.type];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-md p-4 mb-3"
      testID={testID}
    >
      <View className="flex-row items-start">
        <View className={`w-10 h-10 rounded-full items-center justify-center ${colorClass}`}>
          <Icon size={20} color="#64748b" />
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {record.title}
          </Text>

          <Text className="text-sm text-gray-600 mb-2">
            {record.description}
          </Text>

          <Text className="text-sm text-gray-500">
            {format(record.date, 'MMM d, yyyy')}
          </Text>

          {record.veterinarian && (
            <Text className="text-sm text-gray-500 mt-1">
              By: {record.veterinarian}
            </Text>
          )}

          {record.notes && (
            <Text className="text-sm text-gray-500 mt-2 italic">
              {record.notes}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
