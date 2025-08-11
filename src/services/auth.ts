import apiService from './server/apiService';

// Normalized user for the frontend
export interface UserData {
  id: number | string;
  username: string;
  email: string;
  roles?: string[];
  isVerified?: boolean;
}

// Backend response (aceptamos ambos formatos para tokens)
interface BackendAuthResponse {
  message?: string;
  user: UserData | any; // puede venir con userID, userRoles, etc.
  accessToken?: string;      // camelCase (nuevo)
  refreshToken?: string;     // camelCase (nuevo)
  access_token?: string;     // snake_case (legacy)
  refresh_token?: string;    // snake_case (legacy)
}

// Normalized auth response
export interface AuthResponse {
  user: UserData;
  accessToken: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

function pickAccessToken(res: BackendAuthResponse): string {
  return res.accessToken ?? res.access_token ?? '';
}

// Login
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await apiService.post<{
    success: boolean;
    message: string;
    data: BackendAuthResponse;
  }>('/auth/login', credentials);

  const backendData = data.data; 

  return {
    user: backendData.user,
    accessToken: pickAccessToken(backendData),
  };
}


export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Register
export async function register(userData: RegisterData): Promise<BackendAuthResponse> {
  const { data } = await apiService.post<BackendAuthResponse>('/auth/register', userData);
  return data;
}

// Reset password (request)
export async function requestPasswordReset(email: string): Promise<void> {
  await apiService.post('/auth/reset-password', { email });
}

export interface ConfirmResetPasswordData {
  code: string;
  password: string;
  passwordConfirmation: string;
}

// Reset password (confirm)
export async function confirmPasswordReset(data: ConfirmResetPasswordData): Promise<AuthResponse> {
  const { data: backendData } = await apiService.post<BackendAuthResponse>('/auth/reset-password/confirm', data);

  return {
    user: backendData.user,
    accessToken: pickAccessToken(backendData),
  };
}

export async function getProfile(): Promise<UserData> {
  const { data } = await apiService.get('/auth/profile');
  return data;
}
