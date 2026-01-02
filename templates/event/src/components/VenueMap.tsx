import { View, Text, ScrollView } from 'react-native';

export function VenueMap() {
  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <View className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Conference Center - Ground Floor
          </Text>

          {/* Main Hall */}
          <View className="mb-6">
            <View className="bg-accent-100 dark:bg-accent-900/30 rounded-lg p-4 border-2 border-accent-500">
              <Text className="text-center text-lg font-bold text-gray-900 dark:text-white">
                Main Hall
              </Text>
              <Text className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                Capacity: 500
              </Text>
              <Text className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                Keynote Sessions
              </Text>
            </View>
          </View>

          {/* Conference Rooms */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-300 dark:border-blue-700">
              <Text className="text-center font-bold text-gray-900 dark:text-white">
                Room A
              </Text>
              <Text className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                Cap: 150
              </Text>
            </View>

            <View className="flex-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-300 dark:border-purple-700">
              <Text className="text-center font-bold text-gray-900 dark:text-white">
                Room B
              </Text>
              <Text className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                Cap: 100
              </Text>
            </View>

            <View className="flex-1 bg-green-100 dark:bg-green-900/30 rounded-lg p-4 border border-green-300 dark:border-green-700">
              <Text className="text-center font-bold text-gray-900 dark:text-white">
                Room C
              </Text>
              <Text className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                Cap: 120
              </Text>
            </View>
          </View>

          {/* Sponsor Area */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Sponsor Exhibition Hall
            </Text>
            <View className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <View className="flex-row flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((booth) => (
                  <View
                    key={booth}
                    className="bg-white dark:bg-gray-600 rounded p-3 border border-gray-300 dark:border-gray-500"
                  >
                    <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Booth {booth}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Amenities */}
          <View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Amenities
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                <Text className="text-sm text-gray-700 dark:text-gray-300">☕ Coffee Bar</Text>
              </View>
              <View className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                <Text className="text-sm text-gray-700 dark:text-gray-300">🚻 Restrooms</Text>
              </View>
              <View className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                <Text className="text-sm text-gray-700 dark:text-gray-300">📶 WiFi Lounge</Text>
              </View>
              <View className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                <Text className="text-sm text-gray-700 dark:text-gray-300">🍽️ Catering</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
