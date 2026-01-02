import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface PlaybackSpeedProps {
  visible: boolean;
  currentSpeed: number;
  onClose: () => void;
  onSelectSpeed: (speed: number) => void;
  testID?: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function PlaybackSpeed({
  visible,
  currentSpeed,
  onClose,
  onSelectSpeed,
  testID,
}: PlaybackSpeedProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="bg-white dark:bg-gray-800 rounded-t-3xl">
          <View className="p-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Playback Speed
            </Text>

            <View className="space-y-2">
              {SPEEDS.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  onPress={() => {
                    onSelectSpeed(speed);
                    onClose();
                  }}
                  className={`p-4 rounded-lg ${
                    speed === currentSpeed
                      ? 'bg-primary-500'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                  testID={`${testID}-speed-${speed}`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-lg font-medium ${
                        speed === currentSpeed
                          ? 'text-white'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {speed}x
                    </Text>
                    {speed === 1 && (
                      <Text
                        className={`text-sm ${
                          speed === currentSpeed ? 'text-white/80' : 'text-gray-500'
                        }`}
                      >
                        Normal
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
              testID={`${testID}-cancel`}
            >
              <Text className="text-center text-gray-900 dark:text-white font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
