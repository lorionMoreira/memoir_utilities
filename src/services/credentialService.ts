import api from '../config/api';
import { Credential, CreateCredentialRequest, UpdateCredentialRequest } from '../types';

/**
 * Get all credentials
 */
export async function getCredentials(): Promise<Credential[]> {
  try {
    const response = await api.get<Credential[]>('/api/credentials');
    return response.data;
  } catch (error: any) {
    console.error('Get credentials error:', error);
    throw new Error('Failed to load credentials');
  }
}

/**
 * Create a new credential
 */
export async function createCredential(data: CreateCredentialRequest): Promise<Credential> {
  try {
    const response = await api.post<Credential>('/api/credentials', data);
    return response.data;
  } catch (error: any) {
    console.error('Create credential error:', error);
    throw new Error('Failed to create credential');
  }
}

/**
 * Update an existing credential
 */
export async function updateCredential(data: UpdateCredentialRequest): Promise<Credential> {
  try {
    const response = await api.put<Credential>('/api/credential/update', data);
    return response.data;
  } catch (error: any) {
    console.error('Update credential error:', error);
    throw new Error('Failed to update credential');
  }
}

/**
 * Delete a credential
 */
export async function deleteCredential(uuid: string): Promise<void> {
  try {
    await api.delete(`/api/credential/${uuid}`);
  } catch (error: any) {
    console.error('Delete credential error:', error);
    throw new Error('Failed to delete credential');
  }
}
