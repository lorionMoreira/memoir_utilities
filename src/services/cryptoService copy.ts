import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

/**
 * Derives a master key from user password and salt using PBKDF2
 */
const ITERATIONS = 100000; // Padrão da indústria (OWASP recomenda > 100k)
const KEY_SIZE = 256 / 32; // 256 bits
const IV_SIZE = 16;

export async function deriveMasterKey(password: string, salt: string): Promise<string> {
  try {
    return new Promise((resolve) => {
      // Usamos setTimeout(0) para o JS não travar a tela enquanto calcula
      setTimeout(() => {
        // AQUI ESTÁ O ERRO DO CÓDIGO ANTERIOR CORRIGIDO:
        // Usamos PBKDF2 real com iterações, em vez de SHA256 simples.
        const derivedKey = CryptoJS.PBKDF2(password, salt, {
          keySize: KEY_SIZE,
          iterations: ITERATIONS,
          hasher: CryptoJS.algo.SHA256
        });

        resolve(derivedKey.toString(CryptoJS.enc.Hex));
      }, 0);
    });
  } catch (error) {
    console.error('Error deriving master key:', error);
    throw new Error('Failed to derive encryption key');
  }
}

/**
 * Encrypts a password using AES-256 with explicit IV
 * Returns both IV and encrypted data separately
 */
export async function encryptPassword(data: string, masterKey: string): Promise<{ iv: string; encrypted: string }> {
  try {
    // Generate random IV (16 bytes for AES) using expo-crypto
    const ivBytes = await Crypto.getRandomBytesAsync(IV_SIZE);
    const ivArray = Array.from(ivBytes);
    const iv = CryptoJS.lib.WordArray.create(ivArray);
    
    // Encrypt with explicit IV
    const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Hex.parse(masterKey), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return {
      iv: iv.toString(CryptoJS.enc.Hex),
      encrypted: encrypted.toString()
    };
  } catch (error) {
    console.error('Error encrypting password:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypts a password using AES-256 with provided IV
 */
export function decryptPassword(encryptedContent: string, masterKey: string, iv: string): string {
  try {
    // Parse IV from hex string
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);
    
    // Decrypt with provided IV
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, CryptoJS.enc.Hex.parse(masterKey), {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
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
// const encryptedCompany = await encryptPassword(company.trim(), masterKey);
//      const encryptedSenha = await encryptPassword(senha.trim(), masterKey);