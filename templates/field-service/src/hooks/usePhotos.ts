import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { Photo } from '../types';

export function usePhotos(jobId: string) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take photos.');
      return false;
    }
    return true;
  };

  const takePhoto = async (type: Photo['type'] = 'during') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photo: Photo = {
          id: `photo-${Date.now()}`,
          jobId,
          uri: result.assets[0].uri,
          type,
          uploadedAt: new Date().toISOString(),
        };
        setPhotos((prev) => [...prev, photo]);
        return photo;
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async (type: Photo['type'] = 'during') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map((asset, index) => ({
          id: `photo-${Date.now()}-${index}`,
          jobId,
          uri: asset.uri,
          type,
          uploadedAt: new Date().toISOString(),
        }));
        setPhotos((prev) => [...prev, ...newPhotos]);
        return newPhotos;
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      alert('Failed to pick photos. Please try again.');
    }
  };

  const deletePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const updateCaption = (photoId: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
  };

  return {
    photos,
    uploading,
    takePhoto,
    pickFromGallery,
    deletePhoto,
    updateCaption,
  };
}
