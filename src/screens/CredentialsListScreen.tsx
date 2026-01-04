import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Credential } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchCredentials } from '../services/credentialsService';
import { deriveKeyFromFileContent } from '../services/cryptoService';
import { CredentialItem } from '../components/CredentialItem';
import { styles } from './CredentialsListScreen.styles';
import { colors } from '../styles/colors';

type NavigationProp = StackNavigationProp<any>;

export const CredentialsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { authState } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCredentials = async (isRefresh: boolean = false) => {
    if (!authState.masterKey) {
      setError('Master key not available');
      setIsLoading(false);
      return;
    }

    try {
      if (!isRefresh) setIsLoading(true);
      setError('');

      const masterKey = deriveKeyFromFileContent(authState.masterKey);
      const fetchedCredentials = await fetchCredentials(masterKey);
      setCredentials(fetchedCredentials);
    } catch (err) {
      setError((err as Error).message || 'Failed to load credentials');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load credentials when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCredentials();
    }, [authState.masterKey])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCredentials(true);
  };

  const handleEdit = (credential: Credential) => {
    navigation.navigate('EditCredential', { credential });
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !isRefreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadCredentials()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (credentials.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔐</Text>
        <Text style={styles.emptyText}>No credentials yet</Text>
        <Text style={styles.emptySubtext}>
          Add your first credential from the Settings tab
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={credentials}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CredentialItem credential={item} onEdit={handleEdit} />
        )}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};
