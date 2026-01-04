import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { createCredential, updateCredential, deleteCredential } from '../services/credentialsService';
import { deriveKeyFromFileContent } from '../services/cryptoService';
import { Credential } from '../types';
import { styles } from './CredentialFormScreen.styles';
import { colors } from '../styles/colors';

type NavigationProp = StackNavigationProp<any>;
type RouteParams = RouteProp<{ params: { credential?: Credential } }, 'params'>;

export const AddCredentialScreen: React.FC = () => {
  return <CredentialFormScreen mode="add" />;
};

export const EditCredentialScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const credential = route.params?.credential;
  return <CredentialFormScreen mode="edit" existingCredential={credential} />;
};

interface CredentialFormScreenProps {
  mode: 'add' | 'edit';
  existingCredential?: Credential;
}

const CredentialFormScreen: React.FC<CredentialFormScreenProps> = ({ mode, existingCredential }) => {
  const navigation = useNavigation<NavigationProp>();
  const { authState } = useAuth();
  
  const [organization, setOrganization] = useState(existingCredential?.organization || '');
  const [password, setPassword] = useState(existingCredential?.password || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!organization.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!authState.masterKey) {
      setError('Master key not available');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const masterKey = deriveKeyFromFileContent(authState.masterKey);

      if (mode === 'add') {
        await createCredential(organization.trim(), password, masterKey);
      } else if (existingCredential) {
        await updateCredential(existingCredential.id, organization.trim(), password, masterKey);
      }

      navigation.goBack();
    } catch (err) {
      setError((err as Error).message || 'Failed to save credential');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!existingCredential) return;

    Alert.alert(
      'Delete Credential',
      `Are you sure you want to delete the credential for "${existingCredential.organization}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteCredential(existingCredential.id);
              navigation.goBack();
            } catch (err) {
              setError((err as Error).message || 'Failed to delete credential');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const isButtonDisabled = !organization.trim() || !password.trim() || isLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Organization / Service</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Gmail, Facebook, etc."
          placeholderTextColor={colors.textSecondary}
          value={organization}
          onChangeText={setOrganization}
          autoCapitalize="words"
          editable={!isLoading}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isButtonDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'add' ? 'Add Credential' : 'Update Credential'}
            </Text>
          )}
        </TouchableOpacity>

        {mode === 'edit' && existingCredential && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Delete Credential</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
