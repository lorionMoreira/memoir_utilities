import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Photo } from '../types';
import { fetchPhotos } from '../services/photosService';
import { styles } from './PhotosScreen.styles';
import { colors } from '../styles/colors';

type NavigationProp = StackNavigationProp<any>;

export const PhotosScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPhotos(1);
  }, []);

  const loadPhotos = async (page: number) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError('');

      const fetchedPhotos = await fetchPhotos(page);
      
      if (page === 1) {
        setPhotos(fetchedPhotos);
      } else {
        setPhotos((prev) => [...prev, ...fetchedPhotos]);
      }

      setHasMore(fetchedPhotos.length === 9); // 9 photos per page
      setCurrentPage(page);
    } catch (err) {
      setError((err as Error).message || 'Failed to load photos');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadPhotos(currentPage + 1);
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    navigation.navigate('FullScreenPhoto', { photo });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (photos.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyText}>
          No photos yet{'\n'}Upload photos from the Settings tab
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => handlePhotoPress(item)}
          >
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
};
