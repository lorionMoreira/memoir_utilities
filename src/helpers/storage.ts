import * as SecureStore from 'expo-secure-store';

// Storage keys
const TOKEN_KEY = 'auth_token';
const SALT_KEY = 'auth_salt';
const TOKEN_EXPIRY_KEY = 'token_expiry';

/**
 * Save authentication token, salt, and expiry time
 */
export async function saveToken(
  token: string,
  salt: string | null,
  tokenExpiry: string
): Promise<void> {
  try {
    const promises = [
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, tokenExpiry),
    ];
    
    // Only save salt if it's provided
    if (salt !== null) {
      promises.push(SecureStore.setItemAsync(SALT_KEY, salt));
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error saving token to secure store:', error);
    throw error;
  }
}

/**
 * Get authentication token
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token from secure store:', error);
    return null;
  }
}

/**
 * Get salt
 */
export async function getSalt(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SALT_KEY);
  } catch (error) {
    console.error('Error getting salt from secure store:', error);
    return null;
  }
}

/**
 * Get token expiry time
 */
export async function getTokenExpiry(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Error getting token expiry from secure store:', error);
    return null;
  }
}

/**
 * Remove all authentication data
 */
export async function removeToken(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(SALT_KEY),
      SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY),
    ]);
  } catch (error) {
    console.error('Error removing token from secure store:', error);
    throw error;
  }
}

/**
 * Check if token is expired
 */
export async function isTokenExpired(): Promise<boolean> {
  try {
    const expiryStr = await getTokenExpiry();
    if (!expiryStr) return true;

    const expiry = parseInt(expiryStr, 10);
    return Date.now() >= expiry;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
}
