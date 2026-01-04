import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Credential } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { styles } from './CredentialItem.styles';

interface CredentialItemProps {
  credential: Credential;
  onEdit: (credential: Credential) => void;
}

export const CredentialItem: React.FC<CredentialItemProps> = ({ credential, onEdit }) => {
  const { showPasswordsByDefault } = useSettings();
  const [isPasswordVisible, setIsPasswordVisible] = useState(showPasswordsByDefault);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const maskPassword = (password: string) => {
    return '●'.repeat(password.length > 0 ? password.length : 8);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.touchableArea}
        onPress={togglePasswordVisibility}
        activeOpacity={0.7}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.organization}>{credential.organization}</Text>
          <View style={styles.passwordContainer}>
            <Text style={[
              styles.password,
              !isPasswordVisible && styles.passwordMasked
            ]}>
              {isPasswordVisible ? credential.password : maskPassword(credential.password)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => onEdit(credential)}
      >
        <Text style={styles.editButtonText}>✏️</Text>
      </TouchableOpacity>
    </View>
  );
};
