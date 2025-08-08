// src/services/auth.ts
import strapiService from './server/strapiService';

export interface UserData {
  id: number;
  username: string;
  email: string;
  role?: { id: number; name: string };
  isVerified?: boolean;
  [key: string]: any;
}

export interface AuthResponse {
  user: UserData;
  jwt: string;
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  // 1) Autenticación local
  const authResponse = await strapiService.request<AuthResponse>(
    'auth/local',
    {
      method: 'POST',
      data: {
        identifier: email,
        password,
      },
    }
  );
  const { jwt, user } = authResponse;
  if (!jwt) throw new Error('No JWT received');

  // Aquí Strapi nos devuelve el campo 'confirmed'
  if (user && user.confirmed === false) {
    // Lanzamos un error específico que podamos identificar en el frontend
    const error: any = new Error('Email not confirmed');
    error.code = 'USER_NOT_CONFIRMED';
    error.userEmail = user.email; // Adjuntamos el email para poder reenviar el correo
    throw error;
  }

  // 2) Obtener user con el rol poblado
  const userWithRole = await strapiService.authenticatedRequest<UserData>(
    'users/me',
    { method: 'GET', params: { populate: 'role' } },
    jwt
  );

  return { user: userWithRole, jwt };
}

export async function register(
  userData: Record<string, any>
): Promise<AuthResponse> {
  const response = await strapiService.request<AuthResponse>(
    'auth/local/register',
    {
      method: 'POST',
      data: userData,
    }
  );
  return response;
}

export async function providerAuth(
  provider: string,
  accessToken: string
): Promise<AuthResponse> {
  const response = await strapiService.request<AuthResponse>(
    `auth/${provider}/callback`,
    {
      method: 'GET',
      params: { access_token: accessToken },
    }
  );
  return response;
}

export async function getMe(token: string): Promise<UserData> {
  return strapiService.authenticatedRequest<UserData>(
    'users/me',
    { method: 'GET', params: { populate: 'role' } },
    token
  );
}

export async function forgotPassword(email: string): Promise<void> {
  await strapiService.request('auth/forgot-password', {
    method: 'POST',
    data: { email },
  });
}

export async function resetPassword(
  code: string,
  password: string,
  passwordConfirmation: string
): Promise<AuthResponse> {
  return strapiService.request<AuthResponse>('auth/reset-password', {
    method: 'POST',
    data: { code, password, passwordConfirmation },
  });
}

export async function sendEmailConfirmation(email: string): Promise<void> {
  await strapiService.request('auth/send-email-confirmation', {
    method: 'POST',
    data: { email },
  });
}
