import { View, Text, ScrollView } from 'react-native';
import { ReactNode } from 'react';

export interface BookingDetails {
  service?: string;
  staff?: string;
  date: Date;
  time: string;
  duration?: number;
  price?: number;
  location?: string;
  notes?: string;
}

export interface BookingConfirmationProps {
  details: BookingDetails;
  actions?: ReactNode;
  testID?: string;
}

export function BookingConfirmation({
  details,
  actions,
  testID,
}: BookingConfirmationProps) {
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <View className="flex-row justify-between py-3 border-b border-gray-100">
      <Text className="text-gray-600 text-base">{label}</Text>
      <Text className="text-gray-900 font-medium text-base">{value}</Text>
    </View>
  );

  return (
    <ScrollView className="bg-white" testID={testID}>
      <View className="p-6">
        {/* Success indicator */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-3">
            <Text className="text-green-600 text-3xl">✓</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            Booking Confirmed
          </Text>
          <Text className="text-gray-500 text-center">
            Your appointment has been scheduled
          </Text>
        </View>

        {/* Booking details */}
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          {details.service && (
            <DetailRow label="Service" value={details.service} />
          )}
          {details.staff && <DetailRow label="Staff" value={details.staff} />}
          <DetailRow label="Date" value={formatDate(details.date)} />
          <DetailRow label="Time" value={details.time} />
          {details.duration && (
            <DetailRow label="Duration" value={`${details.duration} min`} />
          )}
          {details.location && (
            <DetailRow label="Location" value={details.location} />
          )}
          {details.price && (
            <DetailRow label="Price" value={`$${details.price.toFixed(2)}`} />
          )}
        </View>

        {/* Notes */}
        {details.notes && (
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Notes</Text>
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-gray-600">{details.notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {actions && <View className="mt-4">{actions}</View>}
      </View>
    </ScrollView>
  );
}
