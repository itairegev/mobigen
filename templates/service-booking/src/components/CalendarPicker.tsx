import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfToday } from 'date-fns';

interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  testID?: string;
}

export function CalendarPicker({ selectedDate, onDateSelect, testID }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfToday();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    if (!isBefore(date, today)) {
      onDateSelect(date);
    }
  };

  return (
    <View className="bg-white rounded-xl p-4" testID={testID}>
      {/* Month Header */}
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity onPress={handlePrevMonth} className="p-2">
          <ChevronLeft size={24} color="#0d9488" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} className="p-2">
          <ChevronRight size={24} color="#0d9488" />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View className="flex-row justify-between mb-2">
        {weekDays.map((day) => (
          <View key={day} className="w-10 items-center">
            <Text className="text-xs font-medium text-gray-500">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">
        {/* Empty cells for days before month start */}
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <View key={`empty-${index}`} className="w-10 h-10 m-1" />
        ))}

        {/* Days of month */}
        {daysInMonth.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isPast = isBefore(day, today);
          const isToday = isSameDay(day, today);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => handleDateSelect(day)}
              disabled={isPast}
              className={`w-10 h-10 m-1 rounded-full items-center justify-center ${
                isSelected
                  ? 'bg-primary-500'
                  : isToday
                  ? 'border-2 border-primary-500'
                  : ''
              }`}
              testID={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
            >
              <Text
                className={`text-sm ${
                  isSelected
                    ? 'text-white font-bold'
                    : isPast
                    ? 'text-gray-300'
                    : isToday
                    ? 'text-primary-600 font-semibold'
                    : 'text-gray-900'
                }`}
              >
                {format(day, 'd')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
