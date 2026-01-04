import CryptoJS from 'crypto-js';
import { CRYPTO_CONFIG } from '../constants';

/**
 * Derives an encryption key from file content using PBKDF2
 * @param fileContent - The raw content from the master key file
 * @returns The derived key as a WordArray
 */
export const deriveKeyFromFileContent = (fileContent: string): CryptoJS.lib.WordArray => {
  // Trim whitespace from file content for consistent key derivation
  const trimmedContent = fileContent.trim();
  
  // Use the file content itself as salt (deterministic)
  const salt = CryptoJS.SHA256(trimmedContent).toString();
  
  // Derive key using PBKDF2
  const key = CryptoJS.PBKDF2(trimmedContent, salt, {
    keySize: CRYPTO_CONFIG.KEY_SIZE,
    iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
  });
  
  return key;
};

/**
 * Encrypts credential data using AES-256
 * @param data - The credential object to encrypt (organization + password)
 * @param key - The encryption key derived from master key file
 * @returns Encrypted string in base64 format
 */
export const encryptCredential = (
  data: { organization: string; password: string },
  key: CryptoJS.lib.WordArray
): string => {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  
  return encrypted.toString();
};

/**
 * Decrypts credential data
 * @param encryptedData - The encrypted credential string
 * @param key - The decryption key derived from master key file
 * @returns Decrypted credential object
 */
export const decryptCredential = (
  encryptedData: string,
  key: CryptoJS.lib.WordArray
): { organization: string; password: string } => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Decryption failed - incorrect key or corrupted data');
    }
    
    return JSON.parse(decryptedString);
  } catch (error) {
    throw new Error('Failed to decrypt credential: ' + (error as Error).message);
  }
};

/**
 * Encrypts the master key file content for storage in AsyncStorage
 * @param fileContent - The raw master key file content
 * @param storagePassword - A device-specific or app-specific password for storage encryption
 * @returns Encrypted file content
 */
export const encryptFileContent = (
  fileContent: string,
  storagePassword: string = 'memoir_app_storage_key_v1'
): string => {
  const encrypted = CryptoJS.AES.encrypt(fileContent, storagePassword);
  return encrypted.toString();
};

/**
 * Decrypts the master key file content from AsyncStorage
 * @param encryptedFileContent - The encrypted file content from storage
 * @param storagePassword - The device-specific or app-specific password used for encryption
 * @returns Decrypted file content
 */
export const decryptFileContent = (
  encryptedFileContent: string,
  storagePassword: string = 'memoir_app_storage_key_v1'
): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedFileContent, storagePassword);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Failed to decrypt file content');
    }
    
    return decryptedString;
  } catch (error) {
    throw new Error('Failed to decrypt master key file: ' + (error as Error).message);
  }
};

/**
 * Validates if a key can successfully decrypt a given encrypted credential
 * @param encryptedData - Sample encrypted data
 * @param key - Key to test
 * @returns true if decryption succeeds, false otherwise
 */
export const validateKey = (
  encryptedData: string,
  key: CryptoJS.lib.WordArray
): boolean => {
  try {
    decryptCredential(encryptedData, key);
    return true;
  } catch {
    return false;
  }
};
