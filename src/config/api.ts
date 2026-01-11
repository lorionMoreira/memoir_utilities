import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, saveToken, getTokenExpiry, removeToken } from '../helpers';

// Environment detection
const isDevelopment = __DEV__;

// Base URLs
const DEV_BASE_URL = 'https://raspberrypi.tail6b11e4.ts.net';
const PROD_BASE_URL = 'https://raspberrypi.tail6b11e4.ts.net';

export const API_BASE_URL = isDevelopment ? DEV_BASE_URL : PROD_BASE_URL;

// Token refresh configuration
const TOKEN_REFRESH_BUFFER = 3 * 59 * 1000; // 5 minutes in milliseconds
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token and check expiry
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token logic for login and refresh endpoints
    if (
      config.url?.includes('/api/auth/login') ||
      config.url?.includes('/api/auth/refresh-token')
    ) {
      return config;
    }

    const token = await getToken();
    const tokenExpiry = await getTokenExpiry();

    if (token && tokenExpiry) {
      const now = Date.now();
      const expiryTime = parseInt(tokenExpiry, 10);

      // Check if token expires soon (within 3 minutes)
      if (expiryTime - now < TOKEN_REFRESH_BUFFER) {
        console.log('[API] Token expiring soon, refreshing...');
        
        // If already refreshing, wait for it
        if (isRefreshing && refreshPromise) {   
          const newToken = await refreshPromise;
          if (newToken && config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          return config;
        }

        // Start refresh process
        isRefreshing = true;
        refreshPromise = refreshTokenRequest(token);
        
        try {
          const newToken = await refreshPromise;
          if (newToken && config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
        } catch (error) {
          console.error('[API] Token refresh failed in request interceptor:', error);
          // Clear tokens and let auth context handle logout
          await removeToken();
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      } else if (config.headers) {
        // Token is still valid, use it
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, wait for it
      if (isRefreshing && refreshPromise) {
        try {
          const newToken = await refreshPromise;
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Start refresh process
      const token = await getToken();
      if (token) {
        isRefreshing = true;
        refreshPromise = refreshTokenRequest(token);

        try {
          const newToken = await refreshPromise;
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed in response interceptor:', refreshError);
          await removeToken();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }
    }

    return Promise.reject(error);
  }
);

// Token refresh function
async function refreshTokenRequest(token: string): Promise<string | null> {
  try {
    console.log('[API] Calling refresh token endpoint...');
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/refresh-token`,
      { refreshToken: token },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const { token: newToken, salt } = response.data;
    
    // Calculate new expiry (24 hours from now)
    const newExpiry = Date.now() + 24 * 60 * 60 * 1000;
    
    // Save new token, salt, and expiry
    await saveToken(newToken, salt, newExpiry.toString());
    
    console.log('[API] Token refreshed successfully');
    return newToken;
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    throw error;
  }
}

export default api;
