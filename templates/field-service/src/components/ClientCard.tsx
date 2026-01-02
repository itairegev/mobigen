import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Phone, Mail, Building2, User } from 'lucide-react-native';
import type { Client } from '../types';
import { formatPhoneNumber, getInitials } from '../utils';

interface ClientCardProps {
  client: Client;
  showActions?: boolean;
  testID?: string;
}

export function ClientCard({ client, showActions = true, testID }: ClientCardProps) {
  const handleCall = () => {
    Linking.openURL(`tel:${client.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${client.email}`);
  };

  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200" testID={testID}>
      {/* Header */}
      <View className="flex-row items-center mb-3">
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
          {client.avatar ? (
            <Text>📷</Text>
          ) : (
            <Text className="text-blue-700 font-semibold text-lg">
              {getInitials(client.name)}
            </Text>
          )}
        </View>

        {/* Name and Company */}
        <View className="flex-1 ml-3">
          <Text className="text-lg font-semibold text-gray-900">{client.name}</Text>
          {client.company && (
            <View className="flex-row items-center mt-1">
              <Building2 size={14} color="#6b7280" />
              <Text className="ml-1 text-sm text-gray-600">{client.company}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Contact Info */}
      <View className="space-y-2">
        {/* Phone */}
        <View className="flex-row items-center">
          <Phone size={16} color="#6b7280" />
          <Text className="ml-2 text-sm text-gray-700">
            {formatPhoneNumber(client.phone)}
          </Text>
        </View>

        {/* Email */}
        <View className="flex-row items-center">
          <Mail size={16} color="#6b7280" />
          <Text className="ml-2 text-sm text-gray-700">{client.email}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {showActions && (
        <View className="flex-row gap-3 mt-4 pt-4 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleCall}
            className="flex-1 flex-row items-center justify-center bg-blue-500 py-2 px-4 rounded-lg"
            testID="call-client-button"
          >
            <Phone size={18} color="white" />
            <Text className="ml-2 text-white font-semibold">Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmail}
            className="flex-1 flex-row items-center justify-center bg-gray-500 py-2 px-4 rounded-lg"
            testID="email-client-button"
          >
            <Mail size={18} color="white" />
            <Text className="ml-2 text-white font-semibold">Email</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
