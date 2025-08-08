import apiService from './server/apiService';

// A more generic User data interface. We can expand this later.
export interface UserData {
  id: number | string;
  username: string;
  email: string;
  roles?: string[]; // Assuming roles are an array of strings
  // isVerified might be a property, let's keep it
  isVerified?: boolean;
}

// The response from login or register will likely include user and a token.
export interface AuthResponse {
  user: UserData;
  accessToken: string; // NestJS commonly uses 'accessToken'
}

interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiService.post('/auth/login', credentials);
  // We expect the response data to match AuthResponse.
  // The actual property names (e.g., accessToken vs. jwt) might need adjustment.
  return response.data;
}

interface RegisterData {
  username: string;
  email: string;
  password?: string;
}

// This function now calls the NestJS backend.
export async function register(userData: RegisterData): Promise<AuthResponse> {
  const response = await apiService.post('/auth/register', userData);
  return response.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiService.post('/auth/forgot-password', { email });
}

interface ResetPasswordData {
  code: string;
  password: string;
  passwordConfirmation: string;
}

export async function resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
  const response = await apiService.post('/auth/reset-password', data);
  return response.data;
}

export async function sendEmailConfirmation(email: string): Promise<void> {
  // Endpoint guessed based on common practices.
  await apiService.post('/auth/resend-confirmation', { email });
}

// Optional: A function to get the current user profile if needed for session management.
// This assumes the token is handled by an interceptor in apiService.
export async function getProfile(): Promise<UserData> {
    const response = await apiService.get('/auth/profile');
    return response.data;
}
