import { View, Text, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchSponsors } from '@/services/sponsors';
import { SponsorTile } from '@/components';

export default function SponsorsScreen() {
  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: fetchSponsors,
  });

  // Group sponsors by tier
  const sponsorsByTier = {
    platinum: sponsors.filter((s) => s.tier === 'platinum'),
    gold: sponsors.filter((s) => s.tier === 'gold'),
    silver: sponsors.filter((s) => s.tier === 'silver'),
    bronze: sponsors.filter((s) => s.tier === 'bronze'),
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        data={[
          { tier: 'platinum', title: 'Platinum Sponsors', sponsors: sponsorsByTier.platinum },
          { tier: 'gold', title: 'Gold Sponsors', sponsors: sponsorsByTier.gold },
          { tier: 'silver', title: 'Silver Sponsors', sponsors: sponsorsByTier.silver },
          { tier: 'bronze', title: 'Bronze Sponsors', sponsors: sponsorsByTier.bronze },
        ]}
        keyExtractor={(item) => item.tier}
        contentContainerClassName="px-4 py-4"
        renderItem={({ item }) => (
          item.sponsors.length > 0 && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {item.title}
              </Text>
              {item.sponsors.map((sponsor) => (
                <SponsorTile
                  key={sponsor.id}
                  sponsor={sponsor}
                  onPress={() => Linking.openURL(sponsor.website)}
                  testID={`sponsor-${sponsor.id}`}
                />
              ))}
            </View>
          )
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-gray-500 dark:text-gray-400">
              {isLoading ? 'Loading sponsors...' : 'No sponsors found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
