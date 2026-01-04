import { apiClient } from './authService';
import { API_ENDPOINTS } from '../constants';
import { Credential, ApiResponse } from '../types';
import { encryptCredential, decryptCredential } from './cryptoService';
import CryptoJS from 'crypto-js';

/**
 * Fetch all credentials from backend and decrypt them
 */
export const fetchCredentials = async (
  masterKey: CryptoJS.lib.WordArray
): Promise<Credential[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Credential[]>>(
      API_ENDPOINTS.CREDENTIALS
    );

    if (response.data.success && response.data.data) {
      // Decrypt each credential
      const decryptedCredentials = response.data.data.map((cred) => {
        try {
          if (cred.encryptedData) {
            const decrypted = decryptCredential(cred.encryptedData, masterKey);
            return {
              ...cred,
              organization: decrypted.organization,
              password: decrypted.password,
            };
          }
          return cred;
        } catch (error) {
          console.error(`Failed to decrypt credential ${cred.id}:`, error);
          return {
            ...cred,
            organization: '[Decryption Failed]',
            password: '[Decryption Failed]',
          };
        }
      });

      return decryptedCredentials;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    throw new Error('Failed to fetch credentials');
  }
};

/**
 * Create a new credential (encrypt before sending)
 */
export const createCredential = async (
  organization: string,
  password: string,
  masterKey: CryptoJS.lib.WordArray
): Promise<Credential> => {
  try {
    // Encrypt the credential data
    const encryptedData = encryptCredential({ organization, password }, masterKey);

    const response = await apiClient.post<ApiResponse<Credential>>(
      API_ENDPOINTS.CREDENTIALS,
      { encryptedData }
    );

    if (response.data.success && response.data.data) {
      return {
        ...response.data.data,
        organization,
        password,
      };
    }

    throw new Error(response.data.message || 'Failed to create credential');
  } catch (error) {
    console.error('Failed to create credential:', error);
    throw new Error('Failed to create credential');
  }
};

/**
 * Update an existing credential (encrypt before sending)
 */
export const updateCredential = async (
  id: string,
  organization: string,
  password: string,
  masterKey: CryptoJS.lib.WordArray
): Promise<Credential> => {
  try {
    // Encrypt the credential data
    const encryptedData = encryptCredential({ organization, password }, masterKey);

    const response = await apiClient.put<ApiResponse<Credential>>(
      `${API_ENDPOINTS.CREDENTIALS}/${id}`,
      { encryptedData }
    );

    if (response.data.success && response.data.data) {
      return {
        ...response.data.data,
        organization,
        password,
      };
    }

    throw new Error(response.data.message || 'Failed to update credential');
  } catch (error) {
    console.error('Failed to update credential:', error);
    throw new Error('Failed to update credential');
  }
};

/**
 * Delete a credential
 */
export const deleteCredential = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.CREDENTIALS}/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete credential');
    }
  } catch (error) {
    console.error('Failed to delete credential:', error);
    throw new Error('Failed to delete credential');
  }
};

/**
 * Re-encrypt all credentials with a new master key
 * Used when changing the master key file
 */
export const reEncryptAllCredentials = async (
  oldMasterKey: CryptoJS.lib.WordArray,
  newMasterKey: CryptoJS.lib.WordArray
): Promise<void> => {
  try {
    // Fetch all credentials with old key
    const credentials = await fetchCredentials(oldMasterKey);

    // Re-encrypt and update each credential
    const updatePromises = credentials.map((cred) =>
      updateCredential(cred.id, cred.organization, cred.password, newMasterKey)
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Failed to re-encrypt credentials:', error);
    throw new Error('Failed to re-encrypt credentials with new master key');
  }
};
