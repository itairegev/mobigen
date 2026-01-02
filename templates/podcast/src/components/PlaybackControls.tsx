import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  skipForwardSeconds?: number;
  skipBackwardSeconds?: number;
  testID?: string;
}

export function PlaybackControls({
  isPlaying,
  onPlayPause,
  onSkipForward,
  onSkipBackward,
  skipForwardSeconds = 30,
  skipBackwardSeconds = 15,
  testID,
}: PlaybackControlsProps) {
  return (
    <View className="flex-row items-center justify-center space-x-6" testID={testID}>
      <TouchableOpacity
        onPress={onSkipBackward}
        className="items-center"
        testID={`${testID}-skip-back`}
      >
        <SkipBack size={28} color="white" />
        <Text className="text-white text-xs mt-1">{skipBackwardSeconds}s</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPlayPause}
        className="bg-white rounded-full p-4"
        testID={`${testID}-play-pause`}
      >
        {isPlaying ? (
          <Pause size={32} color="#1e1b4b" fill="#1e1b4b" />
        ) : (
          <Play size={32} color="#1e1b4b" fill="#1e1b4b" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSkipForward}
        className="items-center"
        testID={`${testID}-skip-forward`}
      >
        <SkipForward size={28} color="white" />
        <Text className="text-white text-xs mt-1">{skipForwardSeconds}s</Text>
      </TouchableOpacity>
    </View>
  );
}
