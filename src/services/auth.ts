import apiService from './server/apiService';

// The normalized User data interface used throughout the frontend.
export interface UserData {
  id: number | string;
  username: string;
  email: string;
  roles?: string[];
  isVerified?: boolean;
}

// The actual shape of the response from the backend (login and register)
interface BackendAuthResponse {
  message?: string;
  user: UserData;
  access_token: string;
  refresh_token: string;
}

// The normalized auth response used by the frontend application (e.g., in next-auth)
export interface AuthResponse {
  user: UserData;
  accessToken: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

// Login function fetches data and maps it to the normalized AuthResponse
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await apiService.post<BackendAuthResponse>('/auth/login', credentials);
  return {
    user: data.user,
    accessToken: data.access_token,
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// The register function now has a more specific return type.
export async function register(userData: RegisterData): Promise<BackendAuthResponse> {
  const { data } = await apiService.post<BackendAuthResponse>('/auth/register', userData);
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiService.post('/auth/forgot-password', { email });
}

interface ResetPasswordData {
  code: string;
  password: string;
  passwordConfirmation: string;
}

// Assuming reset password also returns a new set of tokens
export async function resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
  const { data: backendData } = await apiService.post<BackendAuthResponse>('/auth/reset-password', data);
  return {
    user: backendData.user,
    accessToken: backendData.access_token,
  };
}

export async function sendEmailConfirmation(email: string): Promise<void> {
  await apiService.post('/auth/resend-confirmation', { email });
}

export async function getProfile(): Promise<UserData> {
  const { data } = await apiService.get('/auth/profile');
  return data;
}
