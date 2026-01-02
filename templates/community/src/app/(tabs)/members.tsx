import { useState } from 'react';
import { View, Text, FlatList, TextInput, RefreshControl } from 'react-native';
import { Search, Users } from 'lucide-react-native';
import { useMembers, useSearchMembers } from '../../hooks';
import { MemberCard } from '../../components';

export default function MembersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allMembers, isLoading: loadingAll, refetch: refetchAll } = useMembers();
  const { data: searchResults, isLoading: loadingSearch } = useSearchMembers(searchQuery);

  const members = searchQuery ? searchResults : allMembers;
  const isLoading = searchQuery ? loadingSearch : loadingAll;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Community Members
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 mb-4">
          Connect with {allMembers?.length || 0} members
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2">
          <Search size={20} color="#94a3b8" />
          <TextInput
            testID="search-input"
            className="flex-1 ml-2 text-gray-900 dark:text-white"
            placeholder="Search members..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        testID="members-list"
        data={members || []}
        renderItem={({ item }) => (
          <MemberCard member={item} testID={`member-${item.id}`} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetchAll} />
        }
        ListEmptyComponent={
          <View className="py-12">
            <Users size={48} color="#cbd5e1" style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text className="text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No members found' : 'No members yet'}
            </Text>
            {searchQuery && (
              <Text className="text-center text-gray-400 dark:text-gray-500 mt-2">
                Try a different search term
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}
