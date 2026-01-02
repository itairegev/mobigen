import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { Track } from '@/types';

interface TrackFilterProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  testID?: string;
}

export function TrackFilter({
  tracks,
  selectedTrackId,
  onSelectTrack,
  testID,
}: TrackFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4"
      testID={testID}
    >
      <TouchableOpacity
        onPress={() => onSelectTrack(null)}
        className={`px-4 py-2 rounded-full mr-2 ${
          selectedTrackId === null
            ? 'bg-primary-500'
            : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <Text
          className={`font-semibold ${
            selectedTrackId === null
              ? 'text-white'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          All Tracks
        </Text>
      </TouchableOpacity>

      {tracks.map((track) => (
        <TouchableOpacity
          key={track.id}
          onPress={() => onSelectTrack(track.id)}
          className="px-4 py-2 rounded-full mr-2"
          style={{
            backgroundColor:
              selectedTrackId === track.id ? track.color : undefined,
          }}
        >
          <Text
            className={`font-semibold ${
              selectedTrackId === track.id
                ? 'text-white'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {track.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
