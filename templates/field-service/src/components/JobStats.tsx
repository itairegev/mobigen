import { View, Text } from 'react-native';
import { CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react-native';
import type { JobStats as JobStatsType } from '../types';

interface JobStatsProps {
  stats: JobStatsType;
  testID?: string;
}

export function JobStats({ stats, testID }: JobStatsProps) {
  return (
    <View className="bg-white rounded-lg p-4" testID={testID}>
      <Text className="text-lg font-semibold text-gray-900 mb-4">Your Stats</Text>

      {/* Today Stats */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-500 mb-2">Today</Text>
        <View className="flex-row gap-2">
          <StatCard
            icon={<CheckCircle size={20} color="#22c55e" />}
            label="Completed"
            value={stats.today.completed.toString()}
            total={stats.today.total}
            color="#22c55e"
          />
          <StatCard
            icon={<Clock size={20} color="#3b82f6" />}
            label="In Progress"
            value={stats.today.inProgress.toString()}
            color="#3b82f6"
          />
        </View>
      </View>

      {/* Week Stats */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-500 mb-2">This Week</Text>
        <View className="flex-row gap-2">
          <StatCard
            icon={<TrendingUp size={20} color="#f59e0b" />}
            label="Total Jobs"
            value={stats.week.total.toString()}
            color="#f59e0b"
          />
          <StatCard
            icon={<Clock size={20} color="#8b5cf6" />}
            label="Hours Worked"
            value={stats.week.hoursWorked.toString()}
            color="#8b5cf6"
          />
        </View>
      </View>

      {/* Month Stats */}
      <View>
        <Text className="text-sm font-medium text-gray-500 mb-2">This Month</Text>
        <View className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
                <DollarSign size={20} color="white" />
              </View>
              <View className="ml-3">
                <Text className="text-sm text-gray-600">Revenue</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  ${stats.month.revenue.toLocaleString()}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-sm text-gray-600">{stats.month.total} jobs</Text>
              <Text className="text-xs text-gray-500">
                {stats.month.completed} completed
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  total?: number;
  color: string;
}

function StatCard({ icon, label, value, total, color }: StatCardProps) {
  return (
    <View className="flex-1 bg-gray-50 rounded-lg p-3">
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="ml-2 text-xs text-gray-600">{label}</Text>
      </View>
      <View className="flex-row items-baseline">
        <Text className="text-2xl font-bold" style={{ color }}>
          {value}
        </Text>
        {total !== undefined && (
          <Text className="text-sm text-gray-500 ml-1">/ {total}</Text>
        )}
      </View>
    </View>
  );
}
