import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { CredentialsListScreen } from '../screens/CredentialsListScreen';
import { AddCredentialScreen, EditCredentialScreen } from '../screens/CredentialFormScreen';
import { PhotosScreen } from '../screens/PhotosScreen';
import { FullScreenPhotoScreen } from '../screens/FullScreenPhotoScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../styles/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Credentials Stack
const CredentialsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="CredentialsList"
        component={CredentialsListScreen}
        options={{ title: 'Credentials' }}
      />
      <Stack.Screen
        name="AddCredential"
        component={AddCredentialScreen}
        options={{ title: 'Add Credential' }}
      />
      <Stack.Screen
        name="EditCredential"
        component={EditCredentialScreen}
        options={{ title: 'Edit Credential' }}
      />
    </Stack.Navigator>
  );
};

// Photos Stack
const PhotosStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="PhotosList"
        component={PhotosScreen}
        options={{ title: 'Photos' }}
      />
      <Stack.Screen
        name="FullScreenPhoto"
        component={FullScreenPhotoScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack
const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.separator,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Credentials"
        component={CredentialsStack}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon icon="🔐" color={color} />,
        }}
      />
      <Tab.Screen
        name="Photos"
        component={PhotosStack}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon icon="📷" color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon icon="⚙️" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon component using emoji
const TabIcon: React.FC<{ icon: string; color: string }> = ({ icon, color }) => {
  return (
    <Text style={{ fontSize: 24, opacity: color === colors.primary ? 1 : 0.5 }}>
      {icon}
    </Text>
  );
};

import { Text } from 'react-native';
