import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Camera, ImageIcon, X } from 'lucide-react-native';
import type { Photo } from '../types';

interface PhotoCaptureProps {
  photos: Photo[];
  onTakePhoto: () => void;
  onPickFromGallery: () => void;
  onDeletePhoto: (photoId: string) => void;
  testID?: string;
}

export function PhotoCapture({
  photos,
  onTakePhoto,
  onPickFromGallery,
  onDeletePhoto,
  testID,
}: PhotoCaptureProps) {
  return (
    <View className="bg-white rounded-lg p-4" testID={testID}>
      <Text className="text-lg font-semibold text-gray-900 mb-4">Job Photos</Text>

      {/* Action Buttons */}
      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity
          onPress={onTakePhoto}
          className="flex-1 flex-row items-center justify-center bg-blue-500 py-3 px-4 rounded-lg"
          testID="take-photo-button"
        >
          <Camera size={20} color="white" />
          <Text className="ml-2 text-white font-semibold">Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPickFromGallery}
          className="flex-1 flex-row items-center justify-center bg-gray-500 py-3 px-4 rounded-lg"
          testID="pick-photo-button"
        >
          <ImageIcon size={20} color="white" />
          <Text className="ml-2 text-white font-semibold">Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {photos.map((photo) => (
              <View key={photo.id} className="relative">
                <Image
                  source={{ uri: photo.uri }}
                  className="w-32 h-32 rounded-lg"
                  testID={`photo-${photo.id}`}
                />

                {/* Photo Type Badge */}
                <View className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-medium">
                    {photo.type}
                  </Text>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => onDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center"
                  testID={`delete-photo-${photo.id}`}
                >
                  <X size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View className="bg-gray-50 rounded-lg p-8 items-center justify-center">
          <Camera size={48} color="#9ca3af" />
          <Text className="text-gray-500 text-center mt-3">
            No photos yet. Take photos to document your work.
          </Text>
        </View>
      )}
    </View>
  );
}
