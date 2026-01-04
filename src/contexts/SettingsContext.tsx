import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from '../types';
import {
  DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES,
  DEFAULT_SHOW_PASSWORDS_BY_DEFAULT,
  STORAGE_KEYS,
} from '../constants';

interface SettingsContextType {
  settings: Settings;
  autoLockTimeoutMinutes: number;
  showPasswordsByDefault: boolean;
  setAutoLockTimeout: (minutes: number) => Promise<void>;
  setShowPasswordsByDefault: (value: boolean) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    autoLockTimeoutMinutes: DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES,
    showPasswordsByDefault: DEFAULT_SHOW_PASSWORDS_BY_DEFAULT,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [timeoutValue, showPasswordsValue] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.AUTO_LOCK_TIMEOUT),
          AsyncStorage.getItem(STORAGE_KEYS.SHOW_PASSWORDS_DEFAULT),
        ]);

        const loadedSettings: Settings = {
          autoLockTimeoutMinutes: timeoutValue
            ? parseInt(timeoutValue, 10)
            : DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES,
          showPasswordsByDefault: showPasswordsValue
            ? showPasswordsValue === 'true'
            : DEFAULT_SHOW_PASSWORDS_BY_DEFAULT,
        };

        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Update auto-lock timeout
  const setAutoLockTimeout = async (minutes: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_LOCK_TIMEOUT, minutes.toString());
      setSettings((prev) => ({
        ...prev,
        autoLockTimeoutMinutes: minutes,
      }));
    } catch (error) {
      console.error('Failed to save auto-lock timeout:', error);
      throw new Error('Failed to save auto-lock timeout setting');
    }
  };

  // Update show passwords by default
  const setShowPasswordsByDefault = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHOW_PASSWORDS_DEFAULT, value.toString());
      setSettings((prev) => ({
        ...prev,
        showPasswordsByDefault: value,
      }));
    } catch (error) {
      console.error('Failed to save show passwords setting:', error);
      throw new Error('Failed to save show passwords setting');
    }
  };

  const value: SettingsContextType = {
    settings,
    autoLockTimeoutMinutes: settings.autoLockTimeoutMinutes,
    showPasswordsByDefault: settings.showPasswordsByDefault,
    setAutoLockTimeout,
    setShowPasswordsByDefault,
    isLoading,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
