import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  Calendar,
  Navigation,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import type { JobStatus } from '../types';
import { statusColors } from '../theme';

interface StatusSelectorProps {
  currentStatus: JobStatus;
  onStatusChange: (status: JobStatus) => void;
  testID?: string;
}

const statusOptions: Array<{
  status: JobStatus;
  label: string;
  icon: any;
  description: string;
}> = [
  {
    status: 'scheduled',
    label: 'Scheduled',
    icon: Calendar,
    description: 'Job is scheduled',
  },
  {
    status: 'en-route',
    label: 'En Route',
    icon: Navigation,
    description: 'Traveling to job site',
  },
  {
    status: 'in-progress',
    label: 'In Progress',
    icon: PlayCircle,
    description: 'Working on the job',
  },
  {
    status: 'on-hold',
    label: 'On Hold',
    icon: PauseCircle,
    description: 'Job is paused',
  },
  {
    status: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    description: 'Job is finished',
  },
  {
    status: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    description: 'Job was cancelled',
  },
];

export function StatusSelector({
  currentStatus,
  onStatusChange,
  testID,
}: StatusSelectorProps) {
  return (
    <View className="bg-white rounded-lg" testID={testID}>
      <Text className="text-lg font-semibold text-gray-900 mb-4 px-4 pt-4">
        Update Status
      </Text>

      <ScrollView className="px-4 pb-4">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentStatus === option.status;
          const color = statusColors[option.status];

          return (
            <TouchableOpacity
              key={option.status}
              onPress={() => onStatusChange(option.status)}
              className={`flex-row items-center p-4 rounded-lg mb-2 border-2 ${
                isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
              testID={`status-option-${option.status}`}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon size={20} color={color} />
              </View>

              <View className="flex-1 ml-3">
                <Text
                  className={`text-base font-semibold ${
                    isActive ? 'text-blue-700' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  {option.description}
                </Text>
              </View>

              {isActive && (
                <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                  <CheckCircle size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
