import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';
import { User, AuthState } from '../types';
import { STORAGE_KEYS, DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES } from '../constants';
import {
  login as authLogin,
  logout as authLogout,
  hasValidToken,
  getStoredUser,
} from '../services/authService';
import {
  deriveKeyFromFileContent,
  encryptFileContent,
  decryptFileContent,
} from '../services/cryptoService';

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  lockApp: () => void;
  unlockWithMasterKey: (fileContent: string) => Promise<void>;
  storeMasterKeyFile: (fileContent: string) => Promise<void>;
  hasMasterKeyFile: () => Promise<boolean>;
  changeMasterKeyFile: (newFileContent: string, onReEncrypt: (oldKey: CryptoJS.lib.WordArray, newKey: CryptoJS.lib.WordArray) => Promise<void>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [autoLockTimeoutMinutes, setAutoLockTimeoutMinutes] = useState(DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isUnlocked: false,
    jwtToken: null,
    masterKey: null,
    user: null,
  });

  // Load auto-lock timeout from AsyncStorage
  useEffect(() => {
    const loadTimeout = async () => {
      try {
        const timeout = await AsyncStorage.getItem('@memoir_auto_lock_timeout');
        if (timeout) {
          setAutoLockTimeoutMinutes(parseInt(timeout, 10));
        }
      } catch (error) {
        console.error('Failed to load auto-lock timeout:', error);
      }
    };
    loadTimeout();
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Reset inactivity timer
  const resetLockTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }

    if (authState.isUnlocked && autoLockTimeoutMinutes > 0) {
      lockTimerRef.current = setTimeout(() => {
        lockApp();
      }, autoLockTimeoutMinutes * 60 * 1000);
    }
  }, [authState.isUnlocked, autoLockTimeoutMinutes]);

  // Lock app (clear master key from memory)
  const lockApp = useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      isUnlocked: false,
      masterKey: null,
    }));
    
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground
        const inactiveTime = Date.now() - lastActivityRef.current;
        const lockTimeoutMs = autoLockTimeoutMinutes * 60 * 1000;
        
        if (inactiveTime > lockTimeoutMs && authState.isUnlocked) {
          lockApp();
        } else if (authState.isUnlocked) {
          resetLockTimer();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background
        lastActivityRef.current = Date.now();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [authState.isUnlocked, autoLockTimeoutMinutes, lockApp, resetLockTimer]);

  // Check auth state on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const hasToken = await hasValidToken();
        if (hasToken) {
          const user = await getStoredUser();
          const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
          
          setAuthState({
            isAuthenticated: true,
            isUnlocked: false,
            jwtToken: token,
            masterKey: null,
            user,
          });
        }
      } catch (error) {
        console.error('Failed to check auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  // JWT Login
  const login = async (username: string, password: string) => {
    try {
      const { token, user } = await authLogin(username, password);
      
      setAuthState({
        isAuthenticated: true,
        isUnlocked: false,
        jwtToken: token,
        masterKey: null,
        user,
      });
    } catch (error) {
      throw error;
    }
  };

  // Logout (clear everything)
  const logout = async () => {
    try {
      await authLogout();
      
      setAuthState({
        isAuthenticated: false,
        isUnlocked: false,
        jwtToken: null,
        masterKey: null,
        user: null,
      });
      
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Store master key file (encrypt and save to AsyncStorage)
  const storeMasterKeyFile = async (fileContent: string) => {
    try {
      const encryptedContent = encryptFileContent(fileContent);
      await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTED_MASTER_KEY_FILE, encryptedContent);
    } catch (error) {
      throw new Error('Failed to store master key file');
    }
  };

  // Check if master key file exists
  const hasMasterKeyFile = async (): Promise<boolean> => {
    try {
      const encrypted = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTED_MASTER_KEY_FILE);
      return !!encrypted;
    } catch {
      return false;
    }
  };

  // Unlock with master key (from stored file or new file)
  const unlockWithMasterKey = async (fileContent: string) => {
    try {
      const masterKey = deriveKeyFromFileContent(fileContent);
      
      setAuthState((prev) => ({
        ...prev,
        isUnlocked: true,
        masterKey: fileContent,
      }));

      resetLockTimer();
    } catch (error) {
      throw new Error('Failed to derive master key from file');
    }
  };

  // Change master key file (requires re-encryption of all credentials)
  const changeMasterKeyFile = async (
    newFileContent: string,
    onReEncrypt: (oldKey: CryptoJS.lib.WordArray, newKey: CryptoJS.lib.WordArray) => Promise<void>
  ) => {
    try {
      if (!authState.masterKey) {
        throw new Error('Current master key not available');
      }

      const oldKey = deriveKeyFromFileContent(authState.masterKey);
      const newKey = deriveKeyFromFileContent(newFileContent);

      // Re-encrypt all credentials
      await onReEncrypt(oldKey, newKey);

      // Store new encrypted file content
      await storeMasterKeyFile(newFileContent);

      // Update auth state
      setAuthState((prev) => ({
        ...prev,
        masterKey: newFileContent,
      }));
    } catch (error) {
      throw new Error('Failed to change master key file: ' + (error as Error).message);
    }
  };

  // Reset lock timer on user interaction (call this from screens)
  useEffect(() => {
    if (authState.isUnlocked) {
      resetLockTimer();
    }
  }, [authState.isUnlocked, resetLockTimer]);

  const value: AuthContextType = {
    authState,
    login,
    logout,
    lockApp,
    unlockWithMasterKey,
    storeMasterKeyFile,
    hasMasterKeyFile,
    changeMasterKeyFile,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
