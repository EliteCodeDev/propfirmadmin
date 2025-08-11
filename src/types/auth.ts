// Tipos compartidos entre capa API y NextAuth

export interface UserData {
  id: number | string;
  username: string;
  email: string;
  roles?: string[];
  isVerified?: boolean;
}

export interface AuthResponse {
  user: UserData;
  access_token: string; // tokens mantienen snake_case según backend
  refresh_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password?: string;
}

export interface ResetPasswordData {
  code: string;
  password: string;
  passwordConfirmation: string;
}
