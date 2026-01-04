// Default settings values
export const DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES = 2;
export const DEFAULT_SHOW_PASSWORDS_BY_DEFAULT = false;

// Auto-lock timeout options (in minutes)
export const AUTO_LOCK_TIMEOUT_OPTIONS = [1, 2, 5, 10, 15, 30];

// AsyncStorage keys
export const STORAGE_KEYS = {
  JWT_TOKEN: '@memoir_jwt_token',
  ENCRYPTED_MASTER_KEY_FILE: '@memoir_encrypted_master_key_file',
  AUTO_LOCK_TIMEOUT: '@memoir_auto_lock_timeout',
  SHOW_PASSWORDS_DEFAULT: '@memoir_show_passwords_default',
  USER_DATA: '@memoir_user_data',
};

// API endpoints (relative paths, will be appended to base URL)
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  CREDENTIALS: '/credentials',
  PHOTOS: '/photos',
  UPLOAD_PHOTO: '/photos/upload',
};

// Crypto constants
export const CRYPTO_CONFIG = {
  PBKDF2_ITERATIONS: 10000,
  KEY_SIZE: 256 / 32, // 256 bits = 8 words (32-bit each)
  IV_SIZE: 16, // 128 bits for AES
};

// Pagination
export const PHOTOS_PER_PAGE = 9;
