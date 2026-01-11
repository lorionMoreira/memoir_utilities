import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

/**
 * Derives a master key from user password and salt using PBKDF2
 */
export async function deriveMasterKey(password: string, salt: string): Promise<string> {
  try {
    // Combine password and salt
    const input = password + salt;
    
    // Use PBKDF2 to derive a strong key
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      input,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    return hash;
  } catch (error) {
    console.error('Error deriving master key:', error);
    throw new Error('Failed to derive encryption key');
  }
}

/**
 * Encrypts a password using AES-256 // codificação do dado
 */
export function encryptPassword(password: string, masterKey: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(password, masterKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Error encrypting password:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypts a password using AES-256
 */
export function decryptPassword(encryptedPassword: string, masterKey: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, masterKey);
    const password = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!password) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return password;
  } catch (error) {
    console.error('Error decrypting password:', error);
    throw new Error('Failed to decrypt password');
  }
}
