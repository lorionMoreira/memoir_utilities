import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { updateCredential, deleteCredential } from '../services/credentialService';
import { encryptPassword, decryptPassword } from '../services/cryptoService';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';

type EditCredentialRouteProp = RouteProp<RootStackParamList, 'EditCredential'>;

export default function EditCredentialScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditCredentialRouteProp>();
  const { credential } = route.params;
  const { masterKey } = useAuth();

  const [company, setCompany] = useState('');
  const [senha, setSenha] = useState('');
  const [favoritos, setFavoritos] = useState(credential.favoritos);
  const [isLoading, setIsLoading] = useState(false);

  // Decrypt company and password on mount
  useEffect(() => {
    if (masterKey && credential.iv1 && credential.iv2) {
      try {
        const decryptedCompany = decryptPassword(credential.company, masterKey, credential.iv1);
        const decryptedSenha = decryptPassword(credential.senha, masterKey, credential.iv2);
        setCompany(decryptedCompany);
        setSenha(decryptedSenha);
      } catch (error) {
        Alert.alert('Error', 'Failed to decrypt data. Please try logging in again.');
        console.error('Decryption error:', error);
      }
    }
  }, [credential.company, credential.senha, credential.iv1, credential.iv2, masterKey]);

  const handleUpdate = async () => {
    if (!company.trim() || !senha.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!masterKey) {
      Alert.alert('Error', 'Encryption key not available. Please login again.');
      return;
    }

    setIsLoading(true);
    try {
      // Encrypt both company and password before sending to server
      const encryptedCompany = encryptPassword(company.trim(), masterKey);
      const encryptedSenha = encryptPassword(senha.trim(), masterKey);
      
      await updateCredential({
        uuid: credential.uuid,
        company: encryptedCompany.encrypted,
        senha: encryptedSenha.encrypted,
        iv1: encryptedCompany.iv,
        iv2: encryptedSenha.iv,
        favoritos,
      });
      Alert.alert('Success', 'Credential updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update credential');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Credential',
      'Are you sure you want to delete this credential?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteCredential(credential.uuid);
              Alert.alert('Success', 'Credential deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete credential');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Company *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter company name"
          placeholderTextColor={colors.textTertiary}
          value={company}
          onChangeText={setCompany}
          editable={!isLoading}
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor={colors.textTertiary}
          value={senha}
          onChangeText={setSenha}
          editable={!isLoading}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Add to Favorites</Text>
          <Switch
            value={favoritos}
            onValueChange={setFavoritos}
            disabled={isLoading}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={favoritos ? colors.white : colors.textTertiary}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Update Credential</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isLoading}
        >
          <Text style={styles.deleteButtonText}>Delete Credential</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    padding: 15,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.destructive,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
