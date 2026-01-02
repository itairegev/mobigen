import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Square, Clock } from 'lucide-react-native';
import type { TimeEntry } from '../types';
import { formatElapsedTime, calculateElapsedTime } from '../utils';

interface TimeTrackerProps {
  activeEntry: TimeEntry | null;
  onClockIn: () => void;
  onClockOut: () => void;
  loading?: boolean;
  testID?: string;
}

export function TimeTracker({
  activeEntry,
  onClockIn,
  onClockOut,
  loading = false,
  testID,
}: TimeTrackerProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!activeEntry) {
      setElapsedMinutes(0);
      return;
    }

    // Update elapsed time every minute
    const updateElapsed = () => {
      const minutes = calculateElapsedTime(activeEntry.clockIn);
      setElapsedMinutes(minutes);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activeEntry]);

  const isActive = !!activeEntry;

  return (
    <View
      className={`rounded-lg p-4 ${isActive ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200'}`}
      testID={testID}
    >
      {/* Timer Display */}
      <View className="items-center mb-4">
        <View className="flex-row items-center mb-2">
          <Clock size={24} color={isActive ? '#3b82f6' : '#6b7280'} />
          <Text className="ml-2 text-sm text-gray-600 font-medium">
            {isActive ? 'Time Tracking Active' : 'Not Tracking'}
          </Text>
        </View>

        {isActive && (
          <Text className="text-4xl font-bold text-blue-600 mb-1">
            {formatElapsedTime(elapsedMinutes)}
          </Text>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={isActive ? onClockOut : onClockIn}
        disabled={loading}
        className={`flex-row items-center justify-center py-3 px-6 rounded-lg ${
          isActive ? 'bg-red-500' : 'bg-blue-500'
        } ${loading ? 'opacity-50' : ''}`}
        testID={isActive ? 'clock-out-button' : 'clock-in-button'}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            {isActive ? (
              <Square size={20} color="white" fill="white" />
            ) : (
              <Play size={20} color="white" fill="white" />
            )}
            <Text className="ml-2 text-white font-semibold text-base">
              {isActive ? 'Clock Out' : 'Clock In'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info Text */}
      {isActive && activeEntry && (
        <Text className="text-xs text-gray-500 text-center mt-3">
          Started at{' '}
          {new Date(activeEntry.clockIn).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </View>
  );
}
