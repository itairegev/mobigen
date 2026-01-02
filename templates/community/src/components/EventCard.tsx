import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Video, Users, Clock } from 'lucide-react-native';
import { Event } from '../types';
import { formatEventDate } from '../utils';
import { TierBadge } from './TierBadge';
import { useRouter } from 'expo-router';

interface EventCardProps {
  event: Event;
  testID?: string;
}

export function EventCard({ event, testID }: EventCardProps) {
  const router = useRouter();
  const capacityPercent = event.capacity
    ? (event.attendeeCount / event.capacity) * 100
    : 0;
  const isAlmostFull = capacityPercent >= 80;
  const isFull = event.capacity ? event.attendeeCount >= event.capacity : false;

  return (
    <TouchableOpacity
      testID={testID}
      className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-4 border border-gray-200 dark:border-slate-700"
      onPress={() => router.push(`/events/${event.id}`)}
      activeOpacity={0.7}
    >
      {/* Cover Image */}
      <Image
        source={{ uri: event.coverImage }}
        className="w-full h-40"
        resizeMode="cover"
      />

      {event.tier && (
        <View className="absolute top-2 right-2">
          <TierBadge tier={event.tier} showLabel />
        </View>
      )}

      <View className="p-4">
        {/* Title */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {event.title}
        </Text>

        {/* Date & Time */}
        <View className="flex-row items-center gap-2 mb-2">
          <Calendar size={16} color="#ec4899" />
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {formatEventDate(event.startDate)}
          </Text>
        </View>

        {/* Location/Type */}
        <View className="flex-row items-center gap-2 mb-2">
          {event.type === 'virtual' ? (
            <Video size={16} color="#3b82f6" />
          ) : (
            <MapPin size={16} color="#22c55e" />
          )}
          <Text className="text-sm text-gray-600 dark:text-gray-400 flex-1">
            {event.type === 'virtual'
              ? 'Virtual Event'
              : event.location || 'In-Person Event'}
          </Text>
        </View>

        {/* Host */}
        <View className="flex-row items-center gap-2 mb-3">
          <Image
            source={{ uri: event.host.avatar }}
            className="w-5 h-5 rounded-full"
          />
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Hosted by {event.host.name}
          </Text>
        </View>

        {/* Attendees */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Users size={16} color="#64748b" />
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {event.attendeeCount} {event.capacity && `/ ${event.capacity}`} attending
            </Text>
          </View>

          {isFull && (
            <View className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-red-600 dark:text-red-400">
                Full
              </Text>
            </View>
          )}

          {isAlmostFull && !isFull && (
            <View className="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-orange-600 dark:text-orange-400">
                Almost Full
              </Text>
            </View>
          )}
        </View>

        {/* RSVP Status */}
        {event.rsvpStatus === 'going' && (
          <View className="mt-3 bg-primary-50 dark:bg-primary-900 p-2 rounded">
            <Text className="text-sm font-medium text-primary-600 dark:text-primary-400 text-center">
              ✓ You're going
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
