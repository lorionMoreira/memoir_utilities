import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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
import {  Alert } from 'react-native';
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

  // Safe state setter that ensures proper types
  const safeSetAuthState = useCallback((update: AuthState | ((prev: AuthState) => AuthState)) => {
    console.log('[AuthContext] safeSetAuthState called');
    setAuthState((prev) => {
      console.log('[AuthContext] Previous state:', JSON.stringify(prev));
      const newState = typeof update === 'function' ? update(prev) : update;
      console.log('[AuthContext] New state (before conversion):', JSON.stringify(newState));
      console.log('[AuthContext] isAuthenticated type:', typeof newState.isAuthenticated, 'value:', newState.isAuthenticated);
      console.log('[AuthContext] isUnlocked type:', typeof newState.isUnlocked, 'value:', newState.isUnlocked);
      
      const safeState = {
        isAuthenticated: Boolean(newState.isAuthenticated),
        isUnlocked: Boolean(newState.isUnlocked),
        jwtToken: newState.jwtToken,
        masterKey: newState.masterKey,
        user: newState.user,
      };
      console.log('[AuthContext] Safe state (after conversion):', JSON.stringify(safeState));
      console.log('[AuthContext] Safe isAuthenticated type:', typeof safeState.isAuthenticated, 'value:', safeState.isAuthenticated);
      console.log('[AuthContext] Safe isUnlocked type:', typeof safeState.isUnlocked, 'value:', safeState.isUnlocked);
      return safeState;
    });
  }, []);

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

    if (Boolean(authState.isUnlocked) && autoLockTimeoutMinutes > 0) {
      lockTimerRef.current = setTimeout(() => {
        lockApp();
      }, autoLockTimeoutMinutes * 60 * 1000);
    }
  }, [authState.isUnlocked, autoLockTimeoutMinutes]);

  // Lock app (clear master key from memory)
  const lockApp = useCallback(() => {
    console.log('[lockApp] START');
    safeSetAuthState((prev) => {
      console.log('[lockApp] prev.isAuthenticated:', typeof prev.isAuthenticated, prev.isAuthenticated);
      console.log('[lockApp] prev.isUnlocked:', typeof prev.isUnlocked, prev.isUnlocked);
      return {
        isAuthenticated: prev.isAuthenticated,
        isUnlocked: false,
        jwtToken: prev.jwtToken,
        masterKey: null,
        user: prev.user,
      };
    });
    console.log('[lockApp] State updated');
    
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    console.log('[lockApp] END');
  }, [safeSetAuthState]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground
        const inactiveTime = Date.now() - lastActivityRef.current;
        const lockTimeoutMs = autoLockTimeoutMinutes * 60 * 1000;
        
        if (inactiveTime > lockTimeoutMs && Boolean(authState.isUnlocked)) {
          lockApp();
        } else if (Boolean(authState.isUnlocked)) {
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
          
          safeSetAuthState({
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
      
      safeSetAuthState({
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
      
      safeSetAuthState({
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
      console.error("REAL STORAGE ERROR:", error);
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
      console.log('[unlockWithMasterKey] START - fileContent length:', fileContent?.length);
      const masterKey = deriveKeyFromFileContent(fileContent);
      console.log('[unlockWithMasterKey] Key derived successfully');
      
      // Explicitly set boolean values to prevent type casting errors
      console.log('[unlockWithMasterKey] About to call safeSetAuthState');
      safeSetAuthState((prev) => {
        console.log('[unlockWithMasterKey] Inside safeSetAuthState updater');
        console.log('[unlockWithMasterKey] prev.isAuthenticated:', typeof prev.isAuthenticated, prev.isAuthenticated);
        console.log('[unlockWithMasterKey] prev.isUnlocked:', typeof prev.isUnlocked, prev.isUnlocked);
        return {
          isAuthenticated: prev.isAuthenticated,
          isUnlocked: true,
          jwtToken: prev.jwtToken,
          masterKey: fileContent,
          user: prev.user,
        };
      });
      console.log('[unlockWithMasterKey] safeSetAuthState called, about to resetLockTimer');
        
      resetLockTimer();
      console.log('[unlockWithMasterKey] END - Success');
    } catch (error) {
      console.error('[unlockWithMasterKey] ERROR:', error);
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
      safeSetAuthState((prev) => ({
        isAuthenticated: prev.isAuthenticated,
        isUnlocked: prev.isUnlocked,
        jwtToken: prev.jwtToken,
        masterKey: newFileContent,
        user: prev.user,
      }));
    } catch (error) {
      throw new Error('Failed to change master key file: ' + (error as Error).message);
    }
  };

  // Reset lock timer on user interaction (call this from screens)
  useEffect(() => {
    if (Boolean(authState.isUnlocked)) {
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
