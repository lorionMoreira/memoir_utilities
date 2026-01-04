import { apiClient } from './authService';
import { API_ENDPOINTS, PHOTOS_PER_PAGE } from '../constants';
import { Photo, ApiResponse } from '../types';

/**
 * Fetch paginated photos from backend
 */
export const fetchPhotos = async (page: number = 1): Promise<Photo[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Photo[]>>(
      API_ENDPOINTS.PHOTOS,
      {
        params: {
          page,
          limit: PHOTOS_PER_PAGE,
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    throw new Error('Failed to fetch photos');
  }
};

/**
 * Upload a photo to backend (MinIO via Spring Boot)
 */
export const uploadPhoto = async (
  uri: string,
  filename: string
): Promise<Photo> => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append file with proper typing for React Native
    formData.append('photo', {
      uri,
      type: 'image/jpeg', // Adjust based on actual file type
      name: filename,
    } as any);

    const response = await apiClient.post<ApiResponse<Photo>>(
      API_ENDPOINTS.UPLOAD_PHOTO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to upload photo');
  } catch (error) {
    console.error('Failed to upload photo:', error);
    throw new Error('Failed to upload photo');
  }
};

/**
 * Delete a photo from backend
 */
export const deletePhoto = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.PHOTOS}/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete photo');
    }
  } catch (error) {
    console.error('Failed to delete photo:', error);
    throw new Error('Failed to delete photo');
  }
};

/**
 * Get photo details by ID
 */
export const getPhotoById = async (id: string): Promise<Photo | null> => {
  try {
    const response = await apiClient.get<ApiResponse<Photo>>(
      `${API_ENDPOINTS.PHOTOS}/${id}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch photo details:', error);
    return null;
  }
};
