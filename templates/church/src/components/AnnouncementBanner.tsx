import { View, Text, Image, TouchableOpacity } from 'react-native';
import { AlertCircle, Info, CheckCircle } from 'lucide-react-native';
import { Announcement } from '../types';

interface AnnouncementBannerProps {
  announcement: Announcement;
  onPress?: () => void;
  testID?: string;
}

export function AnnouncementBanner({ announcement, onPress, testID }: AnnouncementBannerProps) {
  const priorityConfig = {
    high: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      iconColor: '#dc2626',
    },
    medium: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      iconColor: '#2563eb',
    },
    low: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      iconColor: '#16a34a',
    },
  };

  const config = priorityConfig[announcement.priority];
  const Icon = config.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className={`${config.bgColor} border ${config.borderColor} rounded-xl p-4 mb-4`}
      testID={testID}
    >
      {announcement.imageUrl && (
        <Image
          source={{ uri: announcement.imageUrl }}
          className="w-full h-32 rounded-lg mb-3"
          resizeMode="cover"
        />
      )}

      <View className="flex-row items-start">
        <Icon size={20} color={config.iconColor} className="mt-0.5" />
        <View className="flex-1 ml-3">
          <Text className={`font-bold text-base ${config.textColor} mb-1`}>
            {announcement.title}
          </Text>
          <Text className={`text-sm ${config.textColor} opacity-80`}>
            {announcement.message}
          </Text>

          {announcement.actionLabel && (
            <View className="mt-3">
              <View className="bg-white px-4 py-2 rounded-lg self-start">
                <Text className={`font-semibold ${config.textColor}`}>
                  {announcement.actionLabel}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
