import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { getPhotos } from '../services/photoService';
import { Photo } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_GAP = 4;
const GRID_PADDING = 16;
const ITEM_WIDTH = (screenWidth - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const ITEM_HEIGHT = 120;

export default function PhotoScreen() {
  const { token } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  
  // Fullscreen viewer state
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const loadPhotos = async (page: number = 0, append: boolean = false) => {
    try {
      const response = await getPhotos(page, 30, 'ASC');
      const newPhotos = append ? [...photos, ...response.content] : response.content;
      
      setPhotos(newPhotos);
      setHasNextPage(response.hasNext);
      setCurrentPage(page);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load photos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadPhotos(0, false);
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setFailedPhotos(new Set());
    loadPhotos(0, false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasNextPage) {
      setIsLoadingMore(true);
      loadPhotos(currentPage + 1, true);
    }
  };

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsFullscreenVisible(true);
  };

  const handlePhotoError = (uuid: string) => {
    setFailedPhotos(prev => new Set(prev).add(uuid));
  };

  const renderGridItem = ({ item, index }: { item: Photo; index: number }) => {
    const isFailed = failedPhotos.has(item.uuid);

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handlePhotoPress(index)}
        activeOpacity={0.7}
      >
        {isFailed ? (
          <View style={styles.errorPlaceholder}>
            <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.errorText}>Failed to load</Text>
          </View>
        ) : (
          <Image
            source={{
              uri: item.downloadUrl,
              headers: {
                Authorization: `Bearer ${token}`
              }
            }}
            style={styles.gridImage}
            contentFit="cover"
            transition={300}
            onError={() => handlePhotoError(item.uuid)}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderFullscreenItem = ({ item }: { item: Photo }) => {
    const isFailed = failedPhotos.has(item.uuid);

    return (
      <View style={styles.fullscreenImageContainer}>
        {isFailed ? (
          <View style={styles.fullscreenErrorPlaceholder}>
            <Ionicons name="image-outline" size={80} color={colors.white} />
            <Text style={styles.fullscreenErrorText}>Failed to load photo</Text>
          </View>
        ) : (
          <Image
            source={{
              uri: item.downloadUrl,
              headers: {
                Authorization: `Bearer ${token}`
              }
            }}
            style={styles.fullscreenImage}
            contentFit="contain"
            transition={500}
            onError={() => handlePhotoError(item.uuid)}
          />
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No photos available</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.uuid}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreenVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsFullscreenVisible(false)}
      >
        <View style={styles.fullscreenContainer}>
          <FlatList
            data={photos}
            renderItem={renderFullscreenItem}
            keyExtractor={(item) => item.uuid}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedPhotoIndex}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            initialNumToRender={3}
            windowSize={3}
            maxToRenderPerBatch={3}
            onScrollToIndexFailed={(info) => {
              console.warn('Scroll to index failed:', info);
            }}
          />
          
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsFullscreenVisible(false)}
          >
            <Ionicons name="close" size={30} color={colors.white} />
          </TouchableOpacity>

          {/* Photo Counter */}
          <View style={styles.photoCounter}>
            <Text style={styles.photoCounterText}>
              {selectedPhotoIndex + 1} / {photos.length}
            </Text>
          </View>
        </View>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  gridContainer: {
    padding: GRID_PADDING,
  },
  columnWrapper: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  errorText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Fullscreen styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  fullscreenImageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
  fullscreenErrorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenErrorText: {
    fontSize: 16,
    color: colors.white,
    marginTop: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  photoCounter: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  photoCounterText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
