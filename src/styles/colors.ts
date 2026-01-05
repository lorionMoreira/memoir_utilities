export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0051D5',
  primaryLight: '#4DA3FF',

  // Secondary colors
  secondary: '#5856D6',
  secondaryDark: '#3634A3',
  secondaryLight: '#8280FF',

  // Background colors
  background: '#F2F2F7',
  backgroundDark: '#000000',
  surface: '#FFFFFF',
  surfaceDark: '#1C1C1E',

  // Text colors
  text: '#000000',
  textSecondary: '#6C6C70',
  textDark: '#FFFFFF',
  textSecondaryDark: '#AEAEB2',

  // Semantic colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // UI elements
  border: '#C6C6C8',
  borderDark: '#38383A',
  separator: '#E5E5EA',
  separatorDark: '#38383A',
  disabled: '#C7C7CC',

  // Special
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  maskBackground: 'rgba(0, 0, 0, 0.7)',

  // Password masking
  passwordMask: '#8E8E93',
};

export type ColorKeys = keyof typeof colors;
