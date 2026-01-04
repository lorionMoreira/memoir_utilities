import { StyleSheet, Platform } from 'react-native';
import { colors } from '../styles/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginRight: 10,
  },
  organization: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  password: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  passwordMasked: {
    color: colors.passwordMask,
    letterSpacing: 2,
  },
  editButton: {
    padding: 8,
    backgroundColor: colors.primary + '10',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 18,
    color: colors.primary,
  },
  touchableArea: {
    flex: 1,
  },
});
