import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Share, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../contexts/AuthContext';
import { styles } from './MasterKeyFileScreen.styles';
import { colors } from '../styles/colors';

export const MasterKeyFileScreen: React.FC = () => {
  const { unlockWithMasterKey, storeMasterKeyFile, hasMasterKeyFile, authState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  React.useEffect(() => {
    checkMasterKeyFileExists();
  }, []);

  const checkMasterKeyFileExists = async () => {
    const exists = await hasMasterKeyFile();
    setIsFirstTime(!exists);
  };

  // Generate a strong random master key
  const generateStrongKey = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const length = 64; // 64 character strong key
    let key = '';
    
    // Use expo-crypto for cryptographically secure random bytes
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    
    for (let i = 0; i < length; i++) {
      key += chars[randomBytes[i] % chars.length];
    }
    
    return key;
  };

  const handleGenerateMasterKey = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Generate strong key
      const newKey = await generateStrongKey();
      setGeneratedKey(newKey);
      
      Alert.alert(
        'Master Key Generated',
        'A strong master key has been generated. Please save this file to a secure location on your device.',
        [
          {
            text: 'Save File',
            onPress: () => handleSaveGeneratedKey(newKey),
          },
        ]
      );
    } catch (err) {
      setError('Failed to generate master key');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneratedKey = async (key: string) => {
    try {
      setIsLoading(true);
      
      // Create file in cache directory
      const fileName = `memoir_master_key_${Date.now()}.txt`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      // Write key to file
      await FileSystem.writeAsStringAsync(fileUri, key);
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share/Save file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Save Master Key File',
          UTI: 'public.plain-text',
        });
        
        // After sharing, ask if they want to use it now
        Alert.alert(
          'Use This Key?',
          'Would you like to use this generated key now to unlock the app?',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Use Key',
              onPress: async () => {
                await storeMasterKeyFile(key);
                await unlockWithMasterKey(key);
                setSuccess('Master key set and app unlocked!');
              },
            },
          ]
        );
      } else {
        // Fallback: just store and use the key
        await storeMasterKeyFile(key);
        await unlockWithMasterKey(key);
        setSuccess('Master key generated and set! (File saved to cache)');
        
        Alert.alert(
          'Key Generated',
          `Your master key has been generated and is ready to use. For backup, here's your key:\n\n${key}\n\nPlease save this somewhere safe!`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Save key error:', err);
      setError('Failed to save key file. Using generated key anyway.');
      
      // Still store and use the key even if save failed
      try {
        await storeMasterKeyFile(key);
        await unlockWithMasterKey(key);
      } catch (unlockErr) {
        setError('Failed to set up master key');
      }
    } finally {
      setIsLoading(false);
      setGeneratedKey(null);
    }
  };

const handleSelectFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/plain', // Or '*/*'
      copyToCacheDirectory: true, // <--- CRITICAL FOR ANDROID
      multiple: false
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    
    // Read the file content
    // Because we used copyToCacheDirectory, the URI is safe to read
    const fileContent = await FileSystem.readAsStringAsync(asset.uri);

    //Alert.alert(fileContent)
    // Validate that it looks like a key (optional but good)
    if (!fileContent || fileContent.length < 10) {
      throw new Error("File appears empty or invalid");
    }

    // Now call your store function
    await storeMasterKeyFile(fileContent);
    await unlockWithMasterKey(fileContent);
    Alert.alert("Teste", "Picker funcionou, o erro é na próxima função.4");
    //setSuccess('Key imported successfully!');

  } catch (err: any) {
    // Log the REAL error to console so you can see it
    console.error("Full Error Details:", err);
    
    setError(`File selection error: ${err.message}`);
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
          ? 'Select a text file to use as your master encryption key, or generate a strong key automatically.'
          : 'Select your master key file to unlock the app and access your credentials.'}
      </Text>

      {isFirstTime && (
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleGenerateMasterKey}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Generate Strong Master Key</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled, isFirstTime && { marginTop: 15 }]}
        onPress={handleSelectFile}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.buttonText}>
            {isFirstTime ? 'Select Existing Master Key File' : 'Unlock with Master Key'}
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
