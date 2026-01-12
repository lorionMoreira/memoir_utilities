import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { getCredentials } from '../services/credentialService';
import { decryptPassword } from '../services/cryptoService';
import { useAuth } from '../contexts/AuthContext';
import { Credential } from '../types';

export default function CredencialScreen() {
  const navigation = useNavigation();
  const { masterKey } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [filteredCredentials, setFilteredCredentials] = useState<Credential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const loadCredentials = async (page: number = 0, append: boolean = false) => {
    try {
      const response = await getCredentials(page, 10);
      const newCredentials = append ? [...credentials, ...response.content] : response.content;
      setCredentials(newCredentials);
      setFilteredCredentials(newCredentials);
      setHasNextPage(response.hasNext);
      setCurrentPage(page);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load credentials');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadCredentials(0, false);
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCredentials(0, false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasNextPage) {
      setIsLoadingMore(true);
      loadCredentials(currentPage + 1, true);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredCredentials(credentials);
    } else {
      const filtered = credentials.filter((cred) => {
        // Decrypt company to search through it
        try {
          if (!masterKey || !cred.iv1) return false;
          const decryptedCompany = decryptPassword(cred.company, masterKey, cred.iv1);
          return decryptedCompany.toLowerCase().includes(text.toLowerCase());
        } catch {
          return false;
        }
      });
      setFilteredCredentials(filtered);
    }
  };

  const handleCredentialPress = (credential: Credential) => {
    navigation.navigate('EditCredential' as never, { credential } as never);
  };

  const handleAddNew = () => {
    navigation.navigate('AddCredential' as never);
  };

  const favorites = filteredCredentials.filter((cred) => cred.favoritos);
  const records = filteredCredentials.filter((cred) => !cred.favoritos);

  // Function to decrypt data safely
  const getDecryptedData = (encryptedData: string, iv: string | null): string => {
    if (!masterKey) {
      return '***';
    }
    if (!iv) {
      return '[No IV]';
    }
    try {
      return decryptPassword(encryptedData, masterKey, iv);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return '[Error decrypting]';
    }
  };

  const renderCredentialItem = ({ item }: { item: Credential }) => (
    <TouchableOpacity
      style={styles.credentialItem}
      onPress={() => handleCredentialPress(item)}
    >
      <View style={styles.credentialContent}>
        <Text style={styles.credentialTitle}>{getDecryptedData(item.company, item.iv1)}</Text>
        <Text style={styles.credentialSubtitle}>{getDecryptedData(item.email, item.iv3)}</Text>
        <Text style={styles.credentialSubtitle}>{getDecryptedData(item.senha, item.iv2)}</Text>
        <Text style={styles.credentialDate}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string) => (
    <TouchableOpacity style={styles.sectionHeader}>
      <Ionicons name="chevron-down" size={20} color={colors.text} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search all records..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {favorites.length > 0 && (
              <>
                {renderSectionHeader('Favorites')}
                {favorites.map((item) => (
                  <View key={item.uuid}>{renderCredentialItem({ item })}</View>
                ))}
              </>
            )}

            {records.length > 0 && (
              <>
                {renderSectionHeader('Records')}
                {records.map((item) => (
                  <View key={item.uuid}>{renderCredentialItem({ item })}</View>
                ))}
              </>
            )}

            {filteredCredentials.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No credentials found</Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Text style={styles.addButtonText}>Novo registro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  credentialContent: {
    flex: 1,
  },
  credentialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  credentialSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  credentialDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
