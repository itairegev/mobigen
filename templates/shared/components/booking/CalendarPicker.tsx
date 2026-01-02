import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';

export interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  testID?: string;
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  availableDates,
  minDate,
  maxDate,
  disabledDates = [],
  testID,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(d => isSameDay(d, date))) return true;
    if (availableDates && !availableDates.some(d => isSameDay(d, date))) return true;
    return false;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: JSX.Element[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const isDisabled = isDateDisabled(date);
      const isToday = isSameDay(date, new Date());

      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => !isDisabled && onDateSelect(date)}
          disabled={isDisabled}
          className={`w-10 h-10 items-center justify-center rounded-full ${
            isSelected
              ? 'bg-blue-500'
              : isToday
              ? 'border border-blue-500'
              : ''
          }`}
          testID={`${testID}-day-${day}`}
        >
          <Text
            className={`${
              isSelected
                ? 'text-white font-semibold'
                : isDisabled
                ? 'text-gray-300'
                : 'text-gray-900'
            }`}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View className="bg-white rounded-xl p-4" testID={testID}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity onPress={goToPreviousMonth} className="p-2">
          <Text className="text-blue-500 text-lg font-semibold">←</Text>
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>

        <TouchableOpacity onPress={goToNextMonth} className="p-2">
          <Text className="text-blue-500 text-lg font-semibold">→</Text>
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View className="flex-row justify-around mb-2">
        {dayNames.map(day => (
          <View key={day} className="w-10 items-center">
            <Text className="text-xs text-gray-500 font-medium">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">{renderCalendarDays()}</View>
    </View>
  );
}
