import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  testID?: string;
}

export function EventCard({ event, onPress, testID }: EventCardProps) {
  const formattedDate = event.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const categoryColors = {
    service: 'bg-blue-100 text-blue-700',
    youth: 'bg-purple-100 text-purple-700',
    children: 'bg-pink-100 text-pink-700',
    community: 'bg-green-100 text-green-700',
    outreach: 'bg-orange-100 text-orange-700',
    prayer: 'bg-indigo-100 text-indigo-700',
    worship: 'bg-gold-100 text-gold-700',
    study: 'bg-teal-100 text-teal-700',
  };

  const categoryClass = categoryColors[event.category] || 'bg-gray-100 text-gray-700';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-md mb-4 overflow-hidden"
      testID={testID}
    >
      <Image
        source={{ uri: event.image }}
        className="w-full h-40"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-gray-900 flex-1">{event.title}</Text>
          <View className={`px-2 py-1 rounded-full ${categoryClass}`}>
            <Text className={`text-xs font-medium capitalize ${categoryClass.split(' ')[1]}`}>
              {event.category}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <Calendar size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">{formattedDate}</Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Clock size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">{event.time}</Text>
        </View>

        <View className="flex-row items-center">
          <MapPin size={16} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-2">{event.location}</Text>
        </View>

        {event.registrationRequired && event.capacity && (
          <View className="mt-3 bg-gray-50 rounded-lg px-3 py-2">
            <Text className="text-xs text-gray-600">
              {event.registered || 0} / {event.capacity} registered
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
