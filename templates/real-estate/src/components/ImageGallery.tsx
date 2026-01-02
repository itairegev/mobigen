import { useState } from 'react';
import { View, Image, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';

interface ImageGalleryProps {
  images: string[];
  testID?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ImageGallery({ images, testID }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        testID={testID}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedIndex(index)}
            testID={`${testID}-image-${index}`}
          >
            <Image
              source={{ uri: image }}
              className="w-80 h-64 rounded-lg mr-3 bg-gray-100"
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View className="flex-1 bg-black">
          <TouchableOpacity
            className="absolute top-12 right-4 z-10 p-2 bg-white/20 rounded-full"
            onPress={() => setSelectedIndex(null)}
            testID={`${testID}-close`}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>

          {selectedIndex !== null && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: selectedIndex * SCREEN_WIDTH, y: 0 }}
            >
              {images.map((image, index) => (
                <View
                  key={index}
                  style={{ width: SCREEN_WIDTH }}
                  className="justify-center items-center"
                >
                  <Image
                    source={{ uri: image }}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}
