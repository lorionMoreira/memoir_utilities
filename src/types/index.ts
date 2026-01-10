// Authentication Request/Response Types
export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  salt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User Type
export interface User {
  username: string;
  salt: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Auth Context Type
export interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Credential Types
export interface Credential {
  id: number;
  uuid: string;
  company: string;
  senha: string;
  favoritos: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialRequest {
  company: string;
  senha: string;
  favoritos: boolean;
}

export interface UpdateCredentialRequest {
  uuid: string;
  company: string;
  senha: string;
  favoritos: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Credenciais: undefined;
  Menu1: undefined;
  Menu2: undefined;
  Settings: undefined;
  AddCredential: undefined;
  EditCredential: { credential: Credential };
};
