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

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};
