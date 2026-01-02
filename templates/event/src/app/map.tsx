import { SafeAreaView } from 'react-native-safe-area-context';
import { VenueMap } from '@/components';

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <VenueMap />
    </SafeAreaView>
  );
}
