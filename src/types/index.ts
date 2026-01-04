export interface User {
  id: string;
  username: string;
  email?: string;
}

export interface Credential {
  id: string;
  organization: string;
  password: string;
  encryptedData?: string; // Stored encrypted blob from backend
  createdAt?: string;
  updatedAt?: string;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  uploadedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isUnlocked: boolean;
  jwtToken: string | null;
  masterKey: string | null;
  user: User | null;
}

export interface Settings {
  autoLockTimeoutMinutes: number;
  showPasswordsByDefault: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
