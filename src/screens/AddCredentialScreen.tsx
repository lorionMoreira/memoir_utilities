import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { createCredential } from '../services/credentialService';
import { encryptPassword } from '../services/cryptoService';
import { useAuth } from '../contexts/AuthContext';

export default function AddCredentialScreen() {
  const navigation = useNavigation();
  const { masterKey } = useAuth();
  const [company, setCompany] = useState('');
  const [senha, setSenha] = useState('');
  const [favoritos, setFavoritos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
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
      
      await createCredential({
        company: encryptedCompany.encrypted,
        senha: encryptedSenha.encrypted,
        iv1: encryptedCompany.iv,
        iv2: encryptedSenha.iv,
        favoritos,
      });
      Alert.alert('Success', 'Credential created successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create credential');
    } finally {
      setIsLoading(false);
    }
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
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Save Credential</Text>
          )}
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
