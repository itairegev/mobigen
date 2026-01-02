import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Clock, MapPin } from 'lucide-react-native';
import { useCalendarEvents, useEventsByDate } from '../../hooks/useCalendar';
import { CalendarView } from '../../components/CalendarView';
import { format } from 'date-fns';
import type { CalendarEvent } from '../../types';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: allEvents, refetch, isLoading } = useCalendarEvents();
  const { data: dayEvents } = useEventsByDate(selectedDate.toISOString());

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    const iconMap = {
      class: '📚',
      'assignment-due': '📝',
      test: '✏️',
      event: '🎉',
      holiday: '🏖️',
      meeting: '👥',
      deadline: '⏰',
    };
    return iconMap[type] || '📅';
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    const colorMap = {
      class: 'bg-blue-50 border-blue-200',
      'assignment-due': 'bg-amber-50 border-amber-200',
      test: 'bg-red-50 border-red-200',
      event: 'bg-green-50 border-green-200',
      holiday: 'bg-purple-50 border-purple-200',
      meeting: 'bg-indigo-50 border-indigo-200',
      deadline: 'bg-orange-50 border-orange-200',
    };
    return colorMap[type] || 'bg-gray-50 border-gray-200';
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* Calendar Widget */}
        <View className="p-4">
          {allEvents && (
            <CalendarView
              events={allEvents}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              testID="calendar-view"
            />
          )}
        </View>

        {/* Selected Date Events */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>

          {isLoading ? (
            <View className="bg-white p-8 rounded-lg border border-gray-200">
              <Text className="text-center text-gray-500">Loading events...</Text>
            </View>
          ) : dayEvents && dayEvents.length > 0 ? (
            dayEvents.map((event) => (
              <View
                key={event.id}
                className={`p-4 rounded-lg border mb-3 ${getEventColor(event.type)}`}
                testID={`event-${event.id}`}
              >
                <View className="flex-row items-start gap-3">
                  <Text className="text-2xl">{getEventIcon(event.type)}</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1">
                      {event.title}
                    </Text>

                    {event.description && (
                      <Text className="text-sm text-gray-600 mb-2">
                        {event.description}
                      </Text>
                    )}

                    {event.subjectName && (
                      <View
                        className="px-2 py-0.5 rounded mb-2"
                        style={{
                          backgroundColor: event.color + '20',
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text className="text-xs font-medium" style={{ color: event.color }}>
                          {event.subjectName}
                        </Text>
                      </View>
                    )}

                    <View className="gap-1">
                      {!event.allDay && event.startTime && (
                        <View className="flex-row items-center gap-1">
                          <Clock size={14} className="text-gray-500" />
                          <Text className="text-xs text-gray-600">
                            {event.startTime}
                            {event.endTime && ` - ${event.endTime}`}
                          </Text>
                        </View>
                      )}

                      {event.location && (
                        <View className="flex-row items-center gap-1">
                          <MapPin size={14} className="text-gray-500" />
                          <Text className="text-xs text-gray-600">{event.location}</Text>
                        </View>
                      )}

                      {event.allDay && (
                        <Text className="text-xs text-gray-500">All Day</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white p-8 rounded-lg border border-gray-200">
              <Text className="text-center text-gray-500 text-base">No events scheduled</Text>
              <Text className="text-center text-gray-400 text-sm mt-2">
                Enjoy your free day! 🎉
              </Text>
            </View>
          )}
        </View>

        {/* Event Type Legend */}
        <View className="px-4 pb-8">
          <View className="bg-white p-4 rounded-lg border border-gray-200">
            <Text className="font-semibold text-gray-900 mb-3">Event Types</Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">📚</Text>
                <Text className="text-sm text-gray-600">Class</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">📝</Text>
                <Text className="text-sm text-gray-600">Assignment Due</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">✏️</Text>
                <Text className="text-sm text-gray-600">Test/Quiz</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🎉</Text>
                <Text className="text-sm text-gray-600">School Event</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🏖️</Text>
                <Text className="text-sm text-gray-600">Holiday</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
