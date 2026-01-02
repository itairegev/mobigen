import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSeries, useSermonsBySeries } from '../../hooks/useSermons';
import { SermonCard } from '../../components';

export default function SermonsScreen() {
  const router = useRouter();
  const { data: seriesList, isLoading: seriesLoading } = useSeries();
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const { data: sermons, isLoading: sermonsLoading } = useSermonsBySeries(
    selectedSeries || seriesList?.[0]?.id || ''
  );

  // Auto-select first series when loaded
  if (!selectedSeries && seriesList && seriesList.length > 0) {
    setSelectedSeries(seriesList[0].id);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Series Selector */}
        {seriesLoading ? (
          <View className="p-4">
            <ActivityIndicator size="small" color="#1e40af" />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="bg-white border-b border-gray-200"
            contentContainerStyle={{ padding: 16 }}
          >
            {seriesList?.map((series) => (
              <TouchableOpacity
                key={series.id}
                onPress={() => setSelectedSeries(series.id)}
                className={`mr-3 px-4 py-2 rounded-full ${
                  selectedSeries === series.id
                    ? 'bg-primary-600'
                    : 'bg-gray-100'
                }`}
                testID={`series-${series.id}`}
              >
                <Text
                  className={`font-semibold ${
                    selectedSeries === series.id ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {series.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Series Info */}
        {selectedSeries && seriesList && (
          <View className="bg-white px-6 py-4 border-b border-gray-200">
            {(() => {
              const series = seriesList.find((s) => s.id === selectedSeries);
              if (!series) return null;

              return (
                <>
                  <Text className="text-xl font-bold text-gray-900 mb-2">
                    {series.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    {series.description}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {series.sermonCount} sermons • Started {series.startDate.toLocaleDateString()}
                  </Text>
                </>
              );
            })()}
          </View>
        )}

        {/* Sermons List */}
        <ScrollView className="flex-1 px-6 py-4">
          {sermonsLoading ? (
            <View className="py-8">
              <ActivityIndicator size="large" color="#1e40af" />
            </View>
          ) : sermons && sermons.length > 0 ? (
            sermons.map((sermon) => (
              <SermonCard
                key={sermon.id}
                sermon={sermon}
                onPress={() => router.push(`/sermons/${sermon.id}` as any)}
                testID={`sermon-${sermon.id}`}
              />
            ))
          ) : (
            <View className="py-8 items-center">
              <Text className="text-gray-500 text-center">
                No sermons available for this series yet.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
