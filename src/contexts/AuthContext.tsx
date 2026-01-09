import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as authService from '../services/authService';
import { getToken, getSalt, isTokenExpired, removeToken } from '../helpers';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const appState = useRef(AppState.currentState);

  /**
   * Check for existing authentication on mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Listen for app state changes (foreground/background)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  /**
   * Handle app state changes
   */
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // When app comes to foreground
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      isAuthenticated
    ) {
      console.log('[Auth] App came to foreground, checking token...');
      
      // Check if token is expired
      const expired = await isTokenExpired();
      if (expired) {
        console.log('[Auth] Token expired, refreshing...');
        try {
          const currentToken = await getToken();
          if (currentToken) {
            await authService.refreshToken(currentToken);
            console.log('[Auth] Token refreshed on app focus');
          }
        } catch (error) {
          console.error('[Auth] Failed to refresh token on app focus:', error);
          // Logout user if refresh fails
          await handleLogout();
        }
      }
    }

    appState.current = nextAppState;
  };

  /**
   * Check for existing authentication
   */
  const checkAuth = async () => {
    try {
      const storedToken = await getToken();
      const storedSalt = await getSalt();

      if (storedToken && storedSalt) {
        // Check if token is expired
        const expired = await isTokenExpired();
        
        if (expired) {
          console.log('[Auth] Token expired, attempting refresh...');
          try {
            const response = await authService.refreshToken(storedToken);
            setUser({ username: response.username, salt: response.salt });
            setToken(response.token);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('[Auth] Token refresh failed:', error);
            await removeToken();
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
          }
        } else {
          // Token is still valid
          // Note: We don't have username stored separately, 
          // so we'll get it from the first API call or store it separately
          setUser({ username: '', salt: storedSalt });
          setToken(storedToken);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('[Auth] Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login function
   */
  const login = async (username: string, password: string) => {
    try {

      const response = await authService.login(username, password);

      setUser({ username: response.username, salt: response.salt });
      setToken(response.token);
      setIsAuthenticated(true);
    } catch (error: any) {

      throw error; // Re-throw to let LoginScreen handle the error
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    await handleLogout();
  };

  /**
   * Internal logout handler
   */
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
