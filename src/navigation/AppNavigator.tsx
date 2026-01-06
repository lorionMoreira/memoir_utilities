import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { MasterKeyFileScreen } from '../screens/MasterKeyFileScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { colors } from '../styles/colors';

export const AppNavigator: React.FC = () => {
  const { authState, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Explicitly convert to boolean to prevent type casting errors
  const isAuthenticated = Boolean(authState.isAuthenticated);
  const isUnlocked = Boolean(authState.isUnlocked);

  // Not authenticated - show login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Authenticated but not unlocked (no master key) - show master key file screen
  if (!isUnlocked) {
    return <MasterKeyFileScreen />;
  }

  // Fully authenticated and unlocked - show main app
  return <MainTabNavigator />;
};
