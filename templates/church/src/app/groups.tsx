import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroups } from '../hooks/useGroups';
import { GroupCard } from '../components';
import { Filter } from 'lucide-react-native';

export default function GroupsScreen() {
  const { data: groups, isLoading } = useGroups();

  const openGroups = groups?.filter((g) => g.isOpen) || [];
  const fullGroups = groups?.filter((g) => !g.isOpen) || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Small Groups</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Connect with others in meaningful community
              </Text>
            </View>
            <TouchableOpacity
              className="bg-gray-100 w-12 h-12 rounded-full items-center justify-center"
              testID="filter-button"
            >
              <Filter size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Groups List */}
        <ScrollView className="flex-1 px-6 py-4">
          {isLoading ? (
            <View className="py-8">
              <ActivityIndicator size="large" color="#1e40af" />
            </View>
          ) : (
            <>
              {/* Open Groups */}
              {openGroups.length > 0 && (
                <View className="mb-6">
                  <Text className="text-xl font-bold text-gray-900 mb-4">Available Groups</Text>
                  {openGroups.map((group) => (
                    <GroupCard key={group.id} group={group} testID={`group-${group.id}`} />
                  ))}
                </View>
              )}

              {/* Full Groups */}
              {fullGroups.length > 0 && (
                <View className="mb-6">
                  <Text className="text-xl font-bold text-gray-900 mb-4">Full Groups</Text>
                  <Text className="text-sm text-gray-600 mb-4">
                    These groups are currently at capacity. Check back later or contact the leader about a waiting list.
                  </Text>
                  {fullGroups.map((group) => (
                    <View key={group.id} className="opacity-60">
                      <GroupCard group={group} testID={`group-${group.id}`} />
                    </View>
                  ))}
                </View>
              )}

              {groups && groups.length === 0 && (
                <View className="py-8 items-center">
                  <Text className="text-gray-500 text-center">
                    No small groups available at this time.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
