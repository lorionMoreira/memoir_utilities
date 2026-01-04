import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../contexts/AuthContext';
import { styles } from './MasterKeyFileScreen.styles';
import { colors } from '../styles/colors';

export const MasterKeyFileScreen: React.FC = () => {
  const { unlockWithMasterKey, storeMasterKeyFile, hasMasterKeyFile, authState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);

  React.useEffect(() => {
    checkMasterKeyFileExists();
  }, []);

  const checkMasterKeyFileExists = async () => {
    const exists = await hasMasterKeyFile();
    setIsFirstTime(!exists);
  };

  const handleSelectFile = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Open document picker for any readable text file
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accept all file types
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      
      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error('File is empty or cannot be read as text');
      }

      // If first time, store the encrypted file content
      if (isFirstTime) {
        await storeMasterKeyFile(fileContent);
        setSuccess('Master key file stored successfully!');
      }

      // Unlock with master key
      await unlockWithMasterKey(fileContent);
      
      setSuccess('Unlocked successfully!');
    } catch (err) {
      console.error('File selection error:', err);
      setError((err as Error).message || 'Failed to read file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReEnterFile = () => {
    Alert.alert(
      'Re-enter Master Key File',
      'You will need to re-select your master key file. Make sure you select the same file you used initially.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: handleSelectFile },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>🔐</Text>
      </View>

      <Text style={styles.title}>
        {isFirstTime ? 'Setup Master Key' : 'Unlock App'}
      </Text>
      
      <Text style={styles.subtitle}>
        {isFirstTime
          ? 'Select a text file to use as your master encryption key. This file will be used to encrypt all your credentials.'
          : 'Select your master key file to unlock the app and access your credentials.'}
      </Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSelectFile}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.buttonText}>
            {isFirstTime ? 'Select Master Key File' : 'Unlock with Master Key'}
          </Text>
        )}
      </TouchableOpacity>

      {!isFirstTime && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary, marginTop: 15 }]}
          onPress={handleReEnterFile}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Re-enter File</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ⚠️ Important: Keep your master key file safe! If you lose it, you won't be able to decrypt your credentials. 
          The file content itself becomes your encryption key.
        </Text>
      </View>
    </View>
  );
};
