import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT, API_CONFIG } from '../config/api';
import { STORAGE_KEYS, API_ENDPOINTS } from '../constants';
import { User, ApiResponse } from '../types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: API_CONFIG.headers,
});

// Request interceptor to add JWT token to headers
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
    return Promise.reject(error);
  }
);

/**
 * Login with username and password to get JWT token
 */
export const login = async (
  username: string,
  password: string
): Promise<{ token: string; user: User }> => {
  try {
    const response = await apiClient.post<{ token: string; username: string }>(
      API_ENDPOINTS.LOGIN,
      { username, password }
    );

    const { token } = response.data;
    
    // Create user object
    const user: User = {
      id: username,
      username: username,
    };
    
    // Store token and user data
    await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    return { token, user };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || error.message || 'Network error during login'
      );
    }
    throw error;
  }
};

/**
 * Logout - clear token and notify backend
 */
export const logout = async (): Promise<void> => {
  try {
    // Attempt to notify backend (optional, non-blocking)
    await apiClient.post(API_ENDPOINTS.LOGOUT).catch(() => {
      // Ignore logout endpoint errors
    });
  } finally {
    // Always clear local storage
    await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    await AsyncStorage.removeItem(STORAGE_KEYS.ENCRYPTED_MASTER_KEY_FILE);
  }
};

/**
 * Check if user has valid JWT token stored
 */
export const hasValidToken = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  return !!token;
};

/**
 * Get stored user data
 */
export const getStoredUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

/**
 * Refresh JWT token (if backend supports token refresh)
 */
export const refreshToken = async (): Promise<string> => {
  try {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      API_ENDPOINTS.REFRESH_TOKEN
    );

    if (response.data.success && response.data.data) {
      const { token } = response.data.data;
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      return token;
    }

    throw new Error('Token refresh failed');
  } catch (error) {
    await logout();
    throw error;
  }
};

// Export the configured axios instance for use in other services
export { apiClient };
