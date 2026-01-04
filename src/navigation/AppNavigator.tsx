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

  // Not authenticated - show login screen
  if (!authState.isAuthenticated) {
    return <LoginScreen />;
  }

  // Authenticated but not unlocked (no master key) - show master key file screen
  if (!authState.isUnlocked) {
    return <MasterKeyFileScreen />;
  }

  // Fully authenticated and unlocked - show main app
  return <MainTabNavigator />;
};
