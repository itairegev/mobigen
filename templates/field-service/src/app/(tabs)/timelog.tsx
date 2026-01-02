import { useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Calendar } from 'lucide-react-native';
import { useTimeLog } from '@/hooks';
import { formatDuration, formatDate, formatTime } from '@/utils';

export default function TimeLogScreen() {
  const { entries, loading, fetchEntries } = useTimeLog();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    await fetchEntries();
  };

  const handleRefresh = async () => {
    await loadEntries();
  };

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = entry.clockIn.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  // Calculate totals
  const totalHoursToday = entries
    .filter((e) => e.clockIn.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const totalHoursWeek = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
      >
        {/* Stats Header */}
        <View className="bg-white px-6 py-4 mb-4 border-b border-gray-200">
          <View className="flex-row gap-4">
            <View className="flex-1 bg-blue-50 rounded-lg p-4">
              <Text className="text-sm text-blue-600 font-medium mb-1">Today</Text>
              <Text className="text-2xl font-bold text-blue-700">
                {formatDuration(totalHoursToday)}
              </Text>
            </View>
            <View className="flex-1 bg-green-50 rounded-lg p-4">
              <Text className="text-sm text-green-600 font-medium mb-1">This Week</Text>
              <Text className="text-2xl font-bold text-green-700">
                {formatDuration(totalHoursWeek)}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Entries */}
        <View className="px-6 pb-6">
          {sortedDates.length > 0 ? (
            sortedDates.map((date) => (
              <View key={date} className="mb-6">
                {/* Date Header */}
                <View className="flex-row items-center mb-3">
                  <Calendar size={18} color="#6b7280" />
                  <Text className="ml-2 text-base font-semibold text-gray-900">
                    {formatDate(date)}
                  </Text>
                  <View className="ml-auto bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-medium text-gray-600">
                      {formatDuration(
                        groupedEntries[date].reduce(
                          (sum, e) => sum + (e.duration || 0),
                          0
                        )
                      )}
                    </Text>
                  </View>
                </View>

                {/* Entries for this date */}
                {groupedEntries[date].map((entry) => (
                  <TimeEntryCard key={entry.id} entry={entry} />
                ))}
              </View>
            ))
          ) : (
            <View className="bg-white rounded-lg p-8 items-center">
              <Clock size={48} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-3">
                No time entries yet
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Clock in on a job to start tracking time
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface TimeEntryCardProps {
  entry: {
    id: string;
    jobId: string;
    clockIn: string;
    clockOut?: string;
    duration?: number;
    notes?: string;
  };
}

function TimeEntryCard({ entry }: TimeEntryCardProps) {
  const clockInTime = new Date(entry.clockIn);
  const clockOutTime = entry.clockOut ? new Date(entry.clockOut) : null;

  return (
    <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200" testID={`time-entry-${entry.id}`}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
          <Text className="text-base font-semibold text-gray-900">
            Job #{entry.jobId}
          </Text>
        </View>
        {entry.duration && (
          <View className="bg-blue-50 px-3 py-1 rounded-full">
            <Text className="text-sm font-semibold text-blue-700">
              {formatDuration(entry.duration)}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center text-sm text-gray-600">
        <Clock size={14} color="#6b7280" />
        <Text className="ml-2 text-sm text-gray-600">
          {clockInTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {clockOutTime && (
            <Text>
              {' → '}
              {clockOutTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
          {!clockOutTime && <Text className="text-green-600 font-medium"> (Active)</Text>}
        </Text>
      </View>

      {entry.notes && (
        <Text className="text-sm text-gray-500 mt-2 italic">{entry.notes}</Text>
      )}
    </View>
  );
}
