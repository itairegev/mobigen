import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/hooks';

interface ImageGalleryProps {
  images: string[];
  style?: ViewStyle;
  testID?: string;
}

export function ImageGallery({ images, style, testID }: ImageGalleryProps) {
  const { colors } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { width } = Dimensions.get('window');

  return (
    <View style={style} testID={testID}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedIndex(index)}
            className="mr-3"
            testID={`gallery-image-${index}`}
          >
            <Image
              source={{ uri: image }}
              className="w-80 h-60 rounded-xl"
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedIndex !== null && (
        <Modal
          visible={true}
          animationType="fade"
          onRequestClose={() => setSelectedIndex(null)}
          testID="fullscreen-modal"
        >
          <View
            className="flex-1"
            style={{ backgroundColor: colors.background }}
          >
            <TouchableOpacity
              className="absolute top-12 right-4 z-10 p-2"
              onPress={() => setSelectedIndex(null)}
              testID="close-gallery-button"
            >
              <X size={28} color={colors.text} />
            </TouchableOpacity>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: selectedIndex * width, y: 0 }}
            >
              {images.map((image, index) => (
                <View
                  key={index}
                  className="justify-center items-center"
                  style={{ width }}
                >
                  <Image
                    source={{ uri: image }}
                    style={{ width: width - 32, height: width - 32 }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}
