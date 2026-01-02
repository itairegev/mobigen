import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, MapPin, Video, Users, Clock, ExternalLink } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { formatEventDate, formatDate } from '../../utils';
import { useEvent, useUpdateRSVP } from '../../hooks';
import { TierBadge } from '../../components';
import { RSVPStatus } from '../../types';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const updateRSVP = useUpdateRSVP();

  const handleRSVP = (status: RSVPStatus) => {
    if (event) {
      updateRSVP.mutate({ eventId: event.id, userId: '1', status });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <Text className="text-gray-500 dark:text-gray-400">Event not found</Text>
      </View>
    );
  }

  const isFull = event.capacity ? event.attendeeCount >= event.capacity : false;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900">
      {/* Cover Image */}
      <Image
        source={{ uri: event.coverImage }}
        className="w-full h-56"
        resizeMode="cover"
      />

      <View className="p-4">
        {/* Title & Tier */}
        <View className="flex-row items-start justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-1">
            {event.title}
          </Text>
          {event.tier && <TierBadge tier={event.tier} showLabel />}
        </View>

        {/* Date & Time */}
        <View className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Calendar size={20} color="#ec4899" />
            <Text className="text-base font-medium text-gray-900 dark:text-white">
              {formatEventDate(event.startDate)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Clock size={20} color="#94a3b8" />
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Duration: {Math.round((event.endDate.getTime() - event.startDate.getTime()) / 3600000)} hours
            </Text>
          </View>
        </View>

        {/* Location/Link */}
        <View className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
          {event.type === 'virtual' ? (
            <>
              <View className="flex-row items-center gap-2 mb-2">
                <Video size={20} color="#3b82f6" />
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  Virtual Event
                </Text>
              </View>
              {event.meetingLink && event.rsvpStatus === 'going' && (
                <TouchableOpacity className="flex-row items-center gap-2 mt-2">
                  <ExternalLink size={16} color="#3b82f6" />
                  <Text className="text-blue-600 dark:text-blue-400">
                    Join Meeting
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-2">
                <MapPin size={20} color="#22c55e" />
                <Text className="text-base text-gray-900 dark:text-white flex-1">
                  {event.location}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Host */}
        <View className="flex-row items-center mb-4">
          <Image
            source={{ uri: event.host.avatar }}
            className="w-12 h-12 rounded-full"
          />
          <View className="ml-3">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Hosted by</Text>
            <Text className="text-base font-medium text-gray-900 dark:text-white">
              {event.host.name}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          About this event
        </Text>
        <Text className="text-base text-gray-700 dark:text-gray-300 leading-6 mb-4">
          {event.description}
        </Text>

        {/* Attendees */}
        <View className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
          <View className="flex-row items-center gap-2">
            <Users size={20} color="#64748b" />
            <Text className="text-gray-900 dark:text-white font-medium">
              {event.attendeeCount} {event.capacity && `/ ${event.capacity}`} attending
            </Text>
          </View>
          {isFull && (
            <View className="bg-red-100 dark:bg-red-900 px-3 py-1 rounded">
              <Text className="text-sm font-medium text-red-600 dark:text-red-400">
                Event Full
              </Text>
            </View>
          )}
        </View>

        {/* RSVP Buttons */}
        {!isFull && (
          <View className="gap-3">
            {event.rsvpStatus === 'going' ? (
              <>
                <View className="bg-primary-500 p-4 rounded-lg">
                  <Text className="text-white text-center font-semibold text-base">
                    ✓ You're going!
                  </Text>
                </View>
                <TouchableOpacity
                  testID="cancel-rsvp-button"
                  className="border border-gray-300 dark:border-slate-700 p-4 rounded-lg"
                  onPress={() => handleRSVP('not-going')}
                >
                  <Text className="text-gray-700 dark:text-gray-300 text-center font-medium">
                    Cancel RSVP
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  testID="rsvp-going-button"
                  className="bg-primary-500 p-4 rounded-lg"
                  onPress={() => handleRSVP('going')}
                >
                  <Text className="text-white text-center font-semibold text-base">
                    I'm Going
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="rsvp-maybe-button"
                  className="border border-primary-500 p-4 rounded-lg"
                  onPress={() => handleRSVP('maybe')}
                >
                  <Text className="text-primary-600 dark:text-primary-400 text-center font-medium">
                    Maybe
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
