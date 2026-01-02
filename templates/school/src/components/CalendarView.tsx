import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { CalendarEvent } from '../types';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

interface CalendarViewProps {
  events: CalendarEvent[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  testID?: string;
}

export function CalendarView({ events, selectedDate, onDateSelect, testID }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const renderCalendar = () => {
    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayEvents = getEventsForDate(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
        const isCurrent = isToday(currentDay);

        weekDays.push(
          <Pressable
            key={currentDay.toString()}
            onPress={() => onDateSelect?.(currentDay)}
            className={`flex-1 aspect-square items-center justify-center border-b border-gray-100 ${
              isSelected ? 'bg-primary-100' : ''
            }`}
          >
            <View className="relative w-full h-full items-center justify-center">
              {isCurrent && (
                <View className="absolute inset-0 items-center justify-center">
                  <View className="w-8 h-8 rounded-full bg-primary-500/20" />
                </View>
              )}
              <Text
                className={`text-sm font-medium ${
                  !isCurrentMonth
                    ? 'text-gray-300'
                    : isCurrent
                    ? 'text-primary-700'
                    : 'text-gray-700'
                }`}
              >
                {format(currentDay, 'd')}
              </Text>
              {dayEvents.length > 0 && (
                <View className="flex-row gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((_, idx) => (
                    <View
                      key={idx}
                      className="w-1 h-1 rounded-full bg-primary-500"
                    />
                  ))}
                </View>
              )}
            </View>
          </Pressable>
        );
        day = addDays(day, 1);
      }

      days.push(
        <View key={day.toString()} className="flex-row">
          {weekDays}
        </View>
      );
    }

    return days;
  };

  return (
    <View className="bg-white rounded-lg border border-gray-200 overflow-hidden" testID={testID}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Pressable
          onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </Pressable>

        <Text className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </Text>

        <Pressable
          onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View className="flex-row border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} className="flex-1 py-2 items-center">
            <Text className="text-xs font-medium text-gray-500">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View>{renderCalendar()}</View>
    </View>
  );
}
