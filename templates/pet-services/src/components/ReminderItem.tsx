import { View, Text, TouchableOpacity } from 'react-native';
import { Reminder } from '@/types';
import { format, differenceInDays } from 'date-fns';
import { Bell, CheckCircle2, Syringe, Pill, Stethoscope, Scissors } from 'lucide-react-native';

interface ReminderItemProps {
  reminder: Reminder;
  petName?: string;
  onPress?: () => void;
  onComplete?: () => void;
  testID?: string;
}

export function ReminderItem({
  reminder,
  petName,
  onPress,
  onComplete,
  testID,
}: ReminderItemProps) {
  const daysUntil = differenceInDays(reminder.dueDate, new Date());
  const isOverdue = daysUntil < 0;
  const isDueSoon = daysUntil >= 0 && daysUntil <= 7;

  const typeIcons = {
    vaccination: Syringe,
    medication: Pill,
    checkup: Stethoscope,
    grooming: Scissors,
  };

  const Icon = typeIcons[reminder.type];

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-white rounded-xl shadow-md p-4 mb-3 ${
        reminder.completed ? 'opacity-60' : ''
      }`}
      testID={testID}
    >
      <View className="flex-row items-start">
        <View className={`w-10 h-10 rounded-full items-center justify-center ${
          isOverdue ? 'bg-red-100' : isDueSoon ? 'bg-orange-100' : 'bg-primary-100'
        }`}>
          <Icon size={20} color={
            isOverdue ? '#ef4444' : isDueSoon ? '#f97316' : '#f97316'
          } />
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {reminder.title}
          </Text>

          {petName && (
            <Text className="text-sm text-gray-600 mb-1">For: {petName}</Text>
          )}

          <Text className={`text-sm font-medium ${
            isOverdue
              ? 'text-red-600'
              : isDueSoon
              ? 'text-orange-600'
              : 'text-gray-600'
          }`}>
            {isOverdue
              ? `Overdue by ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'}`
              : daysUntil === 0
              ? 'Due today'
              : `Due in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
            }
          </Text>

          <Text className="text-sm text-gray-500 mt-1">
            {format(reminder.dueDate, 'MMM d, yyyy')}
          </Text>

          {reminder.notes && (
            <Text className="text-sm text-gray-500 mt-2 italic">
              {reminder.notes}
            </Text>
          )}
        </View>

        {!reminder.completed && onComplete && (
          <TouchableOpacity
            onPress={onComplete}
            className="w-10 h-10 items-center justify-center"
            testID={`${testID}-complete`}
          >
            <CheckCircle2 size={24} color="#22c55e" />
          </TouchableOpacity>
        )}

        {reminder.completed && (
          <View className="w-10 h-10 items-center justify-center">
            <CheckCircle2 size={24} color="#22c55e" fill="#22c55e" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
