import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, Platform, ActionSheetIOS } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { uploadPhoto } from '../services/photosService';
import { reEncryptAllCredentials } from '../services/credentialsService';
import { AUTO_LOCK_TIMEOUT_OPTIONS } from '../constants';
import { styles } from './SettingsScreen.styles';
import { colors } from '../styles/colors';

type NavigationProp = StackNavigationProp<any>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout, lockApp, changeMasterKeyFile, authState } = useAuth();
  const {
    autoLockTimeoutMinutes,
    showPasswordsByDefault,
    setAutoLockTimeout,
    setShowPasswordsByDefault,
  } = useSettings();
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleAddCredential = () => {
    navigation.navigate('AddCredential');
  };

  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled) return;

      setIsUploadingPhoto(true);
      
      const asset = result.assets[0];
      await uploadPhoto(asset.uri, asset.fileName || 'photo.jpg');
      
      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangeMasterKeyFile = async () => {
    Alert.alert(
      'Change Master Key File',
      'This will re-encrypt all your credentials with the new master key. Make sure you have the new key file ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
              });

              if (result.canceled) return;

              const fileUri = result.assets[0].uri;
              const newFileContent = await FileSystem.readAsStringAsync(fileUri);

              await changeMasterKeyFile(newFileContent, reEncryptAllCredentials);
              
              Alert.alert('Success', 'Master key file changed successfully');
            } catch (error) {
              Alert.alert('Error', (error as Error).message || 'Failed to change master key file');
            }
          },
        },
      ]
    );
  };

  const handleAutoLockTimeoutChange = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...AUTO_LOCK_TIMEOUT_OPTIONS.map((m) => `${m} minute${m > 1 ? 's' : ''}`), 'Cancel'],
          cancelButtonIndex: AUTO_LOCK_TIMEOUT_OPTIONS.length,
        },
        (buttonIndex) => {
          if (buttonIndex < AUTO_LOCK_TIMEOUT_OPTIONS.length) {
            setAutoLockTimeout(AUTO_LOCK_TIMEOUT_OPTIONS[buttonIndex]);
          }
        }
      );
    } else {
      // For Android, use Alert with options
      const options = AUTO_LOCK_TIMEOUT_OPTIONS.map((minutes) => ({
        text: `${minutes} minute${minutes > 1 ? 's' : ''}`,
        onPress: () => setAutoLockTimeout(minutes),
      }));
      options.push({ text: 'Cancel', onPress: async () => {} });
      Alert.alert('Auto-lock Timeout', 'Select timeout duration', options);
    }
  };

  const handleLockNow = () => {
    lockApp();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to re-enter your credentials.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollView}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleAddCredential}>
          <Text style={styles.menuItemText}>Add Credential</Text>
          <Text style={styles.menuItemValue}>➕</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemLast]} 
          onPress={handleAddPhoto}
          disabled={isUploadingPhoto}
        >
          <Text style={styles.menuItemText}>
            {isUploadingPhoto ? 'Uploading...' : 'Add Photo'}
          </Text>
          <Text style={styles.menuItemValue}>📷</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleChangeMasterKeyFile}>
          <Text style={styles.menuItemText}>Change Master Key File</Text>
          <Text style={styles.menuItemValue}>🔑</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAutoLockTimeoutChange}>
          <Text style={styles.menuItemText}>Auto-lock Timeout</Text>
          <Text style={styles.menuItemValue}>{autoLockTimeoutMinutes} min</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLockNow}>
          <Text style={styles.menuItemText}>Lock App Now</Text>
          <Text style={styles.menuItemValue}>🔒</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        
        <View style={[styles.menuItem, styles.menuItemLast]}>
          <Text style={styles.menuItemText}>Show Passwords by Default</Text>
          <Switch
            style={styles.switch}
            value={showPasswordsByDefault}
            onValueChange={setShowPasswordsByDefault}
            trackColor={{ false: colors.disabled, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
          <Text style={[styles.menuItemText, styles.menuItemDanger]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
