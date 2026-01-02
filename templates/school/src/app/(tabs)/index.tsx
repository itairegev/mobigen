import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, BookOpen, TrendingUp, Calendar as CalendarIcon, AlertCircle } from 'lucide-react-native';
import { useUpcomingAssignments } from '../../hooks/useAssignments';
import { useUnreadAnnouncements } from '../../hooks/useAnnouncements';
import { useGPA, useSubjectGradesSummary } from '../../hooks/useGrades';
import { useUpcomingEvents } from '../../hooks/useCalendar';
import { AssignmentCard } from '../../components/AssignmentCard';
import { AnnouncementCard } from '../../components/AnnouncementCard';
import { format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const { data: upcomingAssignments, refetch: refetchAssignments, isLoading: loadingAssignments } = useUpcomingAssignments(3);
  const { data: unreadAnnouncements, refetch: refetchAnnouncements } = useUnreadAnnouncements();
  const { data: gpa, refetch: refetchGPA } = useGPA();
  const { data: gradeSummary, refetch: refetchGrades } = useSubjectGradesSummary();
  const { data: upcomingEvents, refetch: refetchEvents } = useUpcomingEvents(3);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchAssignments(),
      refetchAnnouncements(),
      refetchGPA(),
      refetchGrades(),
      refetchEvents(),
    ]);
    setRefreshing(false);
  };

  const stats = {
    gpa: gpa?.toFixed(2) || '0.00',
    dueToday: upcomingAssignments?.filter(a => {
      const dueDate = new Date(a.dueDate);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    }).length || 0,
    unreadAnnouncements: unreadAnnouncements?.length || 0,
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      {/* Header */}
      <View className="bg-primary-600 px-4 pt-4 pb-6">
        <Text className="text-white text-2xl font-bold mb-1">Welcome Back!</Text>
        <Text className="text-primary-100">Here's your academic overview</Text>
      </View>

      {/* Stats Cards */}
      <View className="px-4 -mt-4 mb-4">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <TrendingUp size={20} className="text-green-600" />
              <Text className="text-2xl font-bold text-gray-900">{stats.gpa}</Text>
            </View>
            <Text className="text-xs text-gray-600">Current GPA</Text>
          </View>

          <View className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <BookOpen size={20} className="text-blue-600" />
              <Text className="text-2xl font-bold text-gray-900">{stats.dueToday}</Text>
            </View>
            <Text className="text-xs text-gray-600">Due Today</Text>
          </View>

          <View className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Bell size={20} className="text-amber-600" />
              <Text className="text-2xl font-bold text-gray-900">{stats.unreadAnnouncements}</Text>
            </View>
            <Text className="text-xs text-gray-600">New Updates</Text>
          </View>
        </View>
      </View>

      {/* Upcoming Assignments */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900">Upcoming Assignments</Text>
          <Pressable onPress={() => router.push('/(tabs)/homework')}>
            <Text className="text-sm text-primary-600 font-medium">View All</Text>
          </Pressable>
        </View>

        {loadingAssignments ? (
          <View className="bg-white p-8 rounded-lg border border-gray-200">
            <Text className="text-center text-gray-500">Loading assignments...</Text>
          </View>
        ) : upcomingAssignments && upcomingAssignments.length > 0 ? (
          upcomingAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onPress={() => router.push(`/homework/${assignment.id}`)}
              testID={`assignment-${assignment.id}`}
            />
          ))
        ) : (
          <View className="bg-white p-8 rounded-lg border border-gray-200">
            <Text className="text-center text-gray-500">No upcoming assignments</Text>
          </View>
        )}
      </View>

      {/* Announcements */}
      {unreadAnnouncements && unreadAnnouncements.length > 0 && (
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">Recent Announcements</Text>
            <Pressable onPress={() => router.push('/announcements')}>
              <Text className="text-sm text-primary-600 font-medium">View All</Text>
            </Pressable>
          </View>

          {unreadAnnouncements.slice(0, 2).map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              testID={`announcement-${announcement.id}`}
            />
          ))}
        </View>
      )}

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">Upcoming Events</Text>
            <Pressable onPress={() => router.push('/(tabs)/calendar')}>
              <Text className="text-sm text-primary-600 font-medium">View Calendar</Text>
            </Pressable>
          </View>

          {upcomingEvents.slice(0, 3).map((event) => (
            <View
              key={event.id}
              className="flex-row items-start gap-3 bg-white p-4 rounded-lg border border-gray-200 mb-2"
            >
              <CalendarIcon size={20} className="text-primary-600 mt-1" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900 mb-1">{event.title}</Text>
                <Text className="text-sm text-gray-600 mb-1">
                  {format(new Date(event.date), 'EEEE, MMMM d')}
                  {event.startTime && ` at ${event.startTime}`}
                </Text>
                {event.location && (
                  <Text className="text-xs text-gray-500">{event.location}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
