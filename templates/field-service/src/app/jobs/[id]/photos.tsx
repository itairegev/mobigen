import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useJobs, usePhotos } from '@/hooks';
import { PhotoCapture } from '@/components';

export default function JobPhotosScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedJob } = useJobs();
  const { photos, takePhoto, pickFromGallery, deletePhoto } = usePhotos(id!);

  if (!selectedJob) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">Job Photos</Text>
          <Text className="text-sm text-gray-600">{selectedJob.title}</Text>
        </View>
      </View>

      <View className="flex-1 p-6">
        <PhotoCapture
          photos={photos}
          onTakePhoto={() => takePhoto('during')}
          onPickFromGallery={() => pickFromGallery('during')}
          onDeletePhoto={deletePhoto}
          testID="job-photos"
        />

        {/* Instructions */}
        <View className="bg-blue-50 rounded-lg p-4 mt-4">
          <Text className="text-sm font-medium text-blue-900 mb-2">
            Photo Tips
          </Text>
          <Text className="text-sm text-blue-700">
            • Take before photos when you arrive{'\n'}
            • Document any issues or damage{'\n'}
            • Capture completed work{'\n'}
            • Photos help with customer records and quality assurance
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
