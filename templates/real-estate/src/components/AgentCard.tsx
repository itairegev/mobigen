import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { Phone, Mail, Star } from 'lucide-react-native';
import { Card } from './Card';
import type { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
  testID?: string;
}

export function AgentCard({ agent, testID }: AgentCardProps) {
  const handleCall = () => {
    Linking.openURL(`tel:${agent.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${agent.email}`);
  };

  return (
    <Card className="p-4" testID={testID}>
      <View className="flex-row">
        <Image
          source={{ uri: agent.avatar }}
          className="w-16 h-16 rounded-full bg-gray-100"
        />
        <View className="flex-1 ml-3">
          <Text className="text-gray-900 font-bold text-lg">{agent.name}</Text>
          <Text className="text-gray-500 text-sm mb-1">{agent.title}</Text>
          <View className="flex-row items-center">
            <Star size={14} color="#facc15" fill="#facc15" />
            <Text className="text-gray-600 text-sm ml-1">
              {agent.rating} ({agent.reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>

      <Text className="text-gray-600 mt-3 mb-4">{agent.bio}</Text>

      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="flex-1 bg-primary-600 py-3 rounded-lg flex-row items-center justify-center"
          onPress={handleCall}
          testID={`${testID}-call`}
        >
          <Phone size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-navy-600 py-3 rounded-lg flex-row items-center justify-center"
          onPress={handleEmail}
          testID={`${testID}-email`}
        >
          <Mail size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">Email</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row mt-4 pt-4 border-t border-gray-200">
        <View className="flex-1">
          <Text className="text-gray-500 text-xs">Experience</Text>
          <Text className="text-gray-900 font-semibold">{agent.yearsExperience} years</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-500 text-xs">Listings</Text>
          <Text className="text-gray-900 font-semibold">{agent.listingsCount}</Text>
        </View>
      </View>
    </Card>
  );
}
