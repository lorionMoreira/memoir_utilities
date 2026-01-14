import api from '../config/api';
import { Photo, PhotoPaginatedResponse, PaginatedResponse } from '../types';

/**
 * Get photos with pagination
 */
export async function getPhotos(
  page: number = 0, 
  size: number = 10, 
  sort: 'ASC' | 'DESC' = 'ASC'
): Promise<PaginatedResponse<Photo>> {
  try {
    const response = await api.get<PhotoPaginatedResponse>('/api/photos', {
      params: { page, size, sort }
    });
    
    // Transform backend response to app's PaginatedResponse format
    const backendData = response.data;
    return {
      content: backendData.content,
      pageSize: backendData.page.size,
      currentPage: backendData.page.number,
      totalPages: backendData.page.totalPages,
      totalItems: backendData.page.totalElements,
      hasNext: backendData.page.number < backendData.page.totalPages - 1,
      hasPrevious: backendData.page.number > 0
    };
  } catch (error: any) {
    console.error('Get photos error:', error);
    throw new Error('Failed to load photos');
  }
}

/**
 * Get photo download URL
 * Note: This function returns the full URL for downloading a specific photo
 */
export function getPhotoDownloadUrl(uuid: string): string {
  return `/api/photos/download/${uuid}`;
}
