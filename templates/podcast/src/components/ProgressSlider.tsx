import { View, TouchableOpacity } from 'react-native';

interface ProgressSliderProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
  testID?: string;
}

export function ProgressSlider({ position, duration, onSeek, testID }: ProgressSliderProps) {
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handlePress = (event: any) => {
    const { locationX, width } = event.nativeEvent;
    const newPosition = (locationX / width) * duration;
    onSeek(newPosition);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="h-8 justify-center"
      testID={testID}
    >
      <View className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
    </TouchableOpacity>
  );
}
