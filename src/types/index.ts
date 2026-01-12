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
  masterKey: string | null;
}

// Credential Types
export interface Credential {
  uuid: string;
  company: string;
  email: string;
  senha: string;
  favoritos: boolean;
  iv1: string | null;
  iv2: string | null;
  iv3: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  pageSize: number;
  totalItems: number;
  hasPrevious: boolean;
  currentPage: number;
  content: T[];
  hasNext: boolean;
  totalPages: number;
}

export interface CreateCredentialRequest {
  company: string;
  email: string;
  senha: string;
  favoritos: boolean;
  iv1: string;
  iv2: string;
  iv3: string;
}

export interface UpdateCredentialRequest {
  uuid: string;
  company: string;
  email: string;
  senha: string;
  favoritos: boolean;
  iv1: string;
  iv2: string;
  iv3: string;
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
