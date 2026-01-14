import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors } from '../styles/colors';

// Screens
import LoginScreen from '../screens/LoginScreen';
import CredencialScreen from '../screens/CredencialScreen';
import PhotoScreen from '../screens/PhotoScreen';
import Menu2Screen from '../screens/Menu2Screen';
import SettingsScreen from '../screens/SettingsScreen';
import AddCredentialScreen from '../screens/AddCredentialScreen';
import EditCredentialScreen from '../screens/EditCredentialScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Tab Navigator Component
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Credenciais') {
            iconName = focused ? 'key' : 'key-outline';
          } else if (route.name === 'Photos') {
            iconName = focused ? 'image' : 'image-outline';
          } else if (route.name === 'Menu2') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Credenciais" 
        component={CredencialScreen}
        options={{
          title: 'Credenciais',
        }}
      />
      <Tab.Screen 
        name="Photos" 
        component={PhotoScreen}
        options={{
          title: 'Gallery',
        }}
      />
      <Tab.Screen 
        name="Menu2" 
        component={Menu2Screen}
        options={{
          title: 'Menu 2',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {isAuthenticated ? (
        // Authenticated Stack - Main Tab Navigator
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AddCredential"
            component={AddCredentialScreen}
            options={{
              title: 'Add Credential',
              headerStyle: {
                backgroundColor: colors.primary,
              },
              headerTintColor: colors.white,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen
            name="EditCredential"
            component={EditCredentialScreen}
            options={{
              title: 'Edit Credential',
              headerStyle: {
                backgroundColor: colors.primary,
              },
              headerTintColor: colors.white,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </>
      ) : (
        // Unauthenticated Stack
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
}
