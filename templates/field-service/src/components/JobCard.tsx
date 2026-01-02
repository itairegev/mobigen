import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Clock, AlertCircle } from 'lucide-react-native';
import type { Job } from '../types';
import { formatTime, formatDuration, getStatusLabel } from '../utils';
import { statusColors, priorityColors } from '../theme';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  testID?: string;
}

export function JobCard({ job, onPress, testID }: JobCardProps) {
  const statusColor = statusColors[job.status];
  const priorityColor = priorityColors[job.priority];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm"
      testID={testID}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {job.title}
          </Text>
          <Text className="text-sm text-gray-600">{job.client.name}</Text>
        </View>

        {/* Status Badge */}
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <Text className="text-xs font-medium" style={{ color: statusColor }}>
            {getStatusLabel(job.status)}
          </Text>
        </View>
      </View>

      {/* Location */}
      <View className="flex-row items-center mb-2">
        <MapPin size={16} color="#6b7280" />
        <Text className="ml-2 text-sm text-gray-600 flex-1" numberOfLines={1}>
          {job.location.address}, {job.location.city}
        </Text>
      </View>

      {/* Time */}
      <View className="flex-row items-center mb-3">
        <Clock size={16} color="#6b7280" />
        <Text className="ml-2 text-sm text-gray-600">
          {formatTime(job.scheduledTime)} • {formatDuration(job.estimatedDuration)}
        </Text>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        {/* Priority */}
        {job.priority !== 'normal' && (
          <View className="flex-row items-center">
            <AlertCircle size={14} color={priorityColor} />
            <Text className="ml-1 text-xs font-medium" style={{ color: priorityColor }}>
              {job.priority.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Tags */}
        <View className="flex-row flex-wrap gap-2 flex-1 justify-end">
          {job.tags.slice(0, 2).map((tag) => (
            <View key={tag} className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs text-gray-600">{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}
