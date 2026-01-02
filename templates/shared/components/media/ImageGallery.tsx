import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { useState } from 'react';

export interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  showThumbnails?: boolean;
  columns?: number;
  aspectRatio?: number;
  onImagePress?: (index: number) => void;
  testID?: string;
}

export function ImageGallery({
  images,
  initialIndex = 0,
  showThumbnails = true,
  columns = 3,
  aspectRatio = 1,
  onImagePress,
  testID,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [modalVisible, setModalVisible] = useState(false);

  const { width: screenWidth } = Dimensions.get('window');
  const imageWidth = (screenWidth - (columns + 1) * 8) / columns;

  const handleImagePress = (index: number) => {
    setSelectedIndex(index);
    setModalVisible(true);
    onImagePress?.(index);
  };

  const renderThumbnail = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      onPress={() => handleImagePress(index)}
      className="m-1"
      testID={`${testID}-thumbnail-${index}`}
    >
      <Image
        source={{ uri: item }}
        style={{
          width: imageWidth,
          height: imageWidth / aspectRatio,
        }}
        className="rounded-lg"
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderFullImage = ({ item }: { item: string }) => (
    <View className="flex-1 items-center justify-center">
      <Image
        source={{ uri: item }}
        className="w-full h-full"
        resizeMode="contain"
      />
    </View>
  );

  return (
    <>
      {/* Thumbnail grid */}
      <FlatList
        data={images}
        renderItem={renderThumbnail}
        keyExtractor={(item, index) => `${item}-${index}`}
        numColumns={columns}
        className="flex-1"
        testID={testID}
      />

      {/* Full screen modal */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black">
          {/* Close button */}
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            className="absolute top-12 right-4 z-10 bg-black/50 w-10 h-10 rounded-full items-center justify-center"
            testID={`${testID}-close`}
          >
            <Text className="text-white text-2xl">×</Text>
          </TouchableOpacity>

          {/* Image counter */}
          <View className="absolute top-12 left-4 z-10 bg-black/50 px-3 py-1.5 rounded-full">
            <Text className="text-white text-sm">
              {selectedIndex + 1} / {images.length}
            </Text>
          </View>

          {/* Full image carousel */}
          <FlatList
            data={images}
            renderItem={renderFullImage}
            keyExtractor={(item, index) => `full-${item}-${index}`}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedIndex}
            onMomentumScrollEnd={event => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / screenWidth
              );
              setSelectedIndex(index);
            }}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />

          {/* Thumbnail strip (optional) */}
          {showThumbnails && images.length > 1 && (
            <View className="absolute bottom-8 left-0 right-0">
              <FlatList
                data={images}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedIndex(index);
                    }}
                    className={`mx-1 ${
                      index === selectedIndex ? 'border-2 border-white' : ''
                    } rounded`}
                  >
                    <Image
                      source={{ uri: item }}
                      className="w-16 h-16 rounded"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => `thumb-${item}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4"
              />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
