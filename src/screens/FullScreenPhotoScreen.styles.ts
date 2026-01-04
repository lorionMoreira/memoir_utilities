import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../styles/colors';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.maskBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: width,
    height: height,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: colors.overlay,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: 'bold',
  },
});
