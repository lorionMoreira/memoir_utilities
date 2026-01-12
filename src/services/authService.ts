import api from '../config/api';
import { saveToken, removeToken } from '../helpers';
import { AuthRequest, AuthResponse } from '../types';

/**
 * Login with username and password
 */
export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  try {
    const requestData: AuthRequest = { username, password };
    
    const response = await api.post<AuthResponse>('/api/auth/entry', requestData);
    
    const { token, username: returnedUsername, salt } = response.data;
    
    // Calculate token expiry (24 hours from now)
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    
    // Save token, salt, and expiry to secure store
    await saveToken(token, salt, tokenExpiry.toString());
    
    return response.data;
  } catch (error: any) {
    // Handle different error responses from backend

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data;
      console.log(error)
      if (status === 401) {
        // Invalid credentials with attempts remaining
        throw new Error(typeof message === 'string' ? message : 'Invalid username or password');
      } else if (status === 403) {
        // Account locked
        throw new Error(typeof message === 'string' ? message : 'Account temporarily locked');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } else if (error.request) {
      
      throw new Error(error.Request);
    } else {
      throw new Error('An unexpected error occurred.');
    }
  }
}

/**
 * Refresh authentication token
 */
export async function refreshToken(token: string): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>('/api/auth/refresh-token', {
      refreshToken: token,
    });

    const { token: newToken, salt } = response.data;
    
    // Calculate new token expiry (24 hours from now)
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    
    // Save new token, salt, and expiry
    await saveToken(newToken, salt, tokenExpiry.toString());
    
    return response.data;
  } catch (error: any) {
    console.error('Token refresh failed:', error);
    
    // If refresh fails, clear stored data
    await removeToken();
    
    if (error.response?.status === 401) {
      throw new Error('Session expired. Please login again.');
    } else {
      throw new Error('Failed to refresh session.');
    }
  }
}

/**
 * Logout - clear all stored authentication data
 */
export async function logout(): Promise<void> {
  try {
    await removeToken();
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}
