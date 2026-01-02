import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useState } from 'react';
import { Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  testID?: string;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  testID,
}: ImageUploaderProps) {
  const [status, requestPermission] = ImagePicker.useCameraPermissions();

  const pickImage = async () => {
    if (!status?.granted) {
      await requestPermission();
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <View className="mb-4" testID={testID}>
      <Text className="text-gray-700 font-medium mb-2">
        Photos ({images.length}/{maxImages})
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {images.map((uri, index) => (
            <View key={index} className="relative">
              <Image
                source={{ uri }}
                className="w-24 h-24 rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                onPress={() => removeImage(index)}
                testID={`remove-image-${index}`}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < maxImages && (
            <TouchableOpacity
              className="w-24 h-24 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300"
              onPress={pickImage}
              testID="add-image-button"
            >
              <Camera size={32} color="#9ca3af" />
              <Text className="text-xs text-gray-500 mt-1">Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {images.length === 0 && (
        <Text className="text-sm text-gray-500 mt-2">
          Add at least one photo of your item
        </Text>
      )}
    </View>
  );
}
