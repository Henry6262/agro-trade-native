import { Platform } from 'react-native';
import { apiClient } from './api';
import { UPLOAD_CONFIG } from '../config/api';
import api from './api';

export interface UploadResult {
  url: string;
  key?: string;
}

export function validateImage(fileSize: number, mimeType: string): string | null {
  if (fileSize > UPLOAD_CONFIG.maxFileSize) {
    return `File size exceeds ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB limit`;
  }
  if (!UPLOAD_CONFIG.allowedImageTypes.includes(mimeType)) {
    return `Unsupported image type. Allowed: ${UPLOAD_CONFIG.allowedImageTypes.join(', ')}`;
  }
  return null;
}

export async function uploadImage(uri: string): Promise<UploadResult> {
  const formData = new FormData();

  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
    name: filename,
    type,
  } as any);

  const response = await api.post('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function uploadMultipleImages(uris: string[]): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  for (const uri of uris) {
    const result = await uploadImage(uri);
    results.push(result);
  }
  return results;
}

export default { uploadImage, uploadMultipleImages, validateImage };
