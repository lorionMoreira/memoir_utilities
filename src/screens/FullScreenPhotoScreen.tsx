import React from 'react';
import { View, TouchableOpacity, Text, Modal, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Photo } from '../types';
import { styles } from './FullScreenPhotoScreen.styles';

type RouteParams = RouteProp<{ params: { photo: Photo } }, 'params'>;

export const FullScreenPhotoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const photo = route.params?.photo;

  if (!photo) {
    navigation.goBack();
    return null;
  }

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.container}>
        <Image
          source={{ uri: photo.url }}
          style={styles.photo}
          resizeMode="contain"
        />
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
