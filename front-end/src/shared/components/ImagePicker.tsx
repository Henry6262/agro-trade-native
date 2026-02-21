import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { uploadImage, validateImage } from '@services/imageService';

interface ImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
}) => {
  const [uploading, setUploading] = useState(false);

  const pickFromGallery = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit reached', `Maximum ${maxImages} images allowed`);
      return;
    }

    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to upload images.');
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxImages - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      await handleAssets(result.assets);
    }
  };

  const pickFromCamera = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit reached', `Maximum ${maxImages} images allowed`);
      return;
    }

    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to take photos.');
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      await handleAssets(result.assets);
    }
  };

  const handleAssets = async (assets: ExpoImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const asset of assets) {
        const mimeType = asset.mimeType || 'image/jpeg';
        const fileSize = asset.fileSize || 0;

        const validationError = validateImage(fileSize, mimeType);
        if (validationError) {
          Alert.alert('Invalid image', validationError);
          continue;
        }

        const result = await uploadImage(asset.uri);
        newUrls.push(result.url);
      }

      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
      }
    } catch (error) {
      Alert.alert('Upload failed', 'Could not upload one or more images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <View>
      {/* Image Thumbnails */}
      {images.length > 0 && (
        <View className="flex-row flex-wrap gap-3 mb-4">
          {images.map((uri, index) => (
            <View key={uri} className="relative">
              <Image
                source={{ uri }}
                className="w-20 h-20 rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
              >
                <X size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Upload Buttons */}
      {images.length < maxImages && (
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={pickFromGallery}
            disabled={uploading}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl border border-dashed border-neutral-600 bg-neutral-800/50"
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <ImagePlus size={18} color="#9CA3AF" />
                <Text className="text-neutral-400 ml-2 text-sm">Gallery</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickFromCamera}
            disabled={uploading}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl border border-dashed border-neutral-600 bg-neutral-800/50"
          >
            <Camera size={18} color="#9CA3AF" />
            <Text className="text-neutral-400 ml-2 text-sm">Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text className="text-neutral-500 text-xs mt-2">
        {images.length}/{maxImages} images {uploading ? '- Uploading...' : ''}
      </Text>
    </View>
  );
};

export default ImagePicker;
